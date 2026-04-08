"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processLongRecording = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("./middleware/auth");
const GOOGLE_LONG_STT_URL = "https://speech.googleapis.com/v1/speech:longrunningrecognize";
const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";
/**
 * Process long recording (>=60s): Cloud Storage gs:// URI → longrunningrecognize → Translate.
 * 2nd gen, extended timeout for polling.
 */
exports.processLongRecording = (0, https_1.onRequest)({
    region: "asia-northeast3",
    memory: "512MiB",
    timeoutSeconds: 540,
    minInstances: 0,
    secrets: ["GOOGLE_CLOUD_API_KEY"],
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    const uid = await (0, auth_1.verifyAuth)(req, res);
    if (!uid)
        return;
    const allowed = await (0, auth_1.checkUsageLimit)(uid, res);
    if (!allowed)
        return;
    const { storagePath } = req.body;
    if (!storagePath) {
        res.status(400).json({ error: "Missing storagePath" });
        return;
    }
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "Server API key not configured" });
        return;
    }
    const bucket = admin.storage().bucket();
    const gsUri = `gs://${bucket.name}/${storagePath}`;
    try {
        // Step 1: Long-running STT with gs:// URI
        const sttResponse = await fetch(`${GOOGLE_LONG_STT_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                config: {
                    encoding: "MP4_AAC",
                    sampleRateHertz: 16000,
                    languageCode: "ko-KR",
                    model: "latest_long",
                    enableAutomaticPunctuation: true,
                },
                audio: { uri: gsUri },
            }),
        });
        if (!sttResponse.ok) {
            const err = await sttResponse.text();
            res.status(502).json({ error: `STT Long failed: ${err}` });
            return;
        }
        const operation = await sttResponse.json();
        const operationName = operation.name;
        // Poll for completion (every 3 seconds, max 8 minutes)
        let koreanTranscript = "";
        const pollUrl = `https://speech.googleapis.com/v1/operations/${operationName}?key=${apiKey}`;
        for (let i = 0; i < 160; i++) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const pollRes = await fetch(pollUrl);
            const pollData = await pollRes.json();
            if (pollData.done) {
                if (pollData.error) {
                    res.status(502).json({ error: `STT operation error: ${pollData.error.message}` });
                    return;
                }
                koreanTranscript = pollData.response?.results
                    ?.map((r) => r.alternatives[0]?.transcript)
                    .filter(Boolean)
                    .join(" ") ?? "";
                break;
            }
        }
        if (!koreanTranscript) {
            // Clean up storage
            try {
                await bucket.file(storagePath).delete();
            }
            catch { }
            res.status(200).json({ koreanTranscript: "", englishTranslation: "", sentences: [] });
            return;
        }
        // Step 2: Translate
        const translateResponse = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: koreanTranscript, source: "ko", target: "en", format: "text" }),
        });
        const translateData = await translateResponse.json();
        const englishTranslation = translateData.data?.translations?.[0]?.translatedText ?? "";
        // Step 3: Sentence pairs
        const koreanSentences = koreanTranscript
            .split(/(?<=[.?!。？！])\s*/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        let sentences = [];
        if (koreanSentences.length > 0) {
            const batchRes = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: koreanSentences, source: "ko", target: "en", format: "text" }),
            });
            const batchData = await batchRes.json();
            const englishSentences = batchData.data?.translations?.map((t) => t.translatedText) ?? [];
            sentences = koreanSentences.map((k, i) => ({
                korean: k,
                english: englishSentences[i] ?? "",
            }));
        }
        // Clean up audio from storage
        try {
            await bucket.file(storagePath).delete();
        }
        catch { }
        // Increment usage
        await (0, auth_1.incrementUsage)(uid);
        res.status(200).json({ koreanTranscript, englishTranslation, sentences });
    }
    catch (error) {
        console.error("processLongRecording error:", error);
        try {
            await bucket.file(storagePath).delete();
        }
        catch { }
        res.status(500).json({ error: error.message ?? "Internal error" });
    }
});
//# sourceMappingURL=processLongRecording.js.map