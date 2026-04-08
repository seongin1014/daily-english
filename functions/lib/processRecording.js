"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRecording = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("./middleware/auth");
const GOOGLE_STT_URL = "https://speech.googleapis.com/v1/speech:recognize";
const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";
/**
 * Process short recording (<60s): base64 audio → STT → Translate → sentence pairs.
 * 2nd gen Cloud Function, asia-northeast3 region.
 */
exports.processRecording = (0, https_1.onRequest)({
    region: "asia-northeast3",
    memory: "512MiB",
    timeoutSeconds: 120,
    minInstances: 0,
    secrets: ["GOOGLE_CLOUD_API_KEY"],
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    // Auth
    const uid = await (0, auth_1.verifyAuth)(req, res);
    if (!uid)
        return;
    // Usage limit
    const allowed = await (0, auth_1.checkUsageLimit)(uid, res);
    if (!allowed)
        return;
    const { audio } = req.body;
    if (!audio) {
        res.status(400).json({ error: "Missing audio data" });
        return;
    }
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "Server API key not configured" });
        return;
    }
    try {
        // Step 1: STT
        const sttResponse = await fetch(`${GOOGLE_STT_URL}?key=${apiKey}`, {
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
                audio: { content: audio },
            }),
        });
        if (!sttResponse.ok) {
            const err = await sttResponse.text();
            res.status(502).json({ error: `STT failed: ${err}` });
            return;
        }
        const sttData = await sttResponse.json();
        const koreanTranscript = sttData.results
            ?.map((r) => r.alternatives[0]?.transcript)
            .filter(Boolean)
            .join(" ") ?? "";
        if (!koreanTranscript) {
            res.status(200).json({ koreanTranscript: "", englishTranslation: "", sentences: [] });
            return;
        }
        // Step 2: Translate full text
        const translateResponse = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: koreanTranscript, source: "ko", target: "en", format: "text" }),
        });
        const translateData = await translateResponse.json();
        const englishTranslation = translateData.data?.translations?.[0]?.translatedText ?? "";
        // Step 3: Split into sentences and translate individually
        const koreanSentences = koreanTranscript
            .split(/(?<=[.?!。？！])\s*/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        let sentences = [];
        if (koreanSentences.length > 0) {
            const batchTranslateRes = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: koreanSentences, source: "ko", target: "en", format: "text" }),
            });
            const batchData = await batchTranslateRes.json();
            const englishSentences = batchData.data?.translations?.map((t) => t.translatedText) ?? [];
            sentences = koreanSentences.map((k, i) => ({
                korean: k,
                english: englishSentences[i] ?? "",
            }));
        }
        // Increment usage
        await (0, auth_1.incrementUsage)(uid);
        res.status(200).json({ koreanTranscript, englishTranslation, sentences });
    }
    catch (error) {
        console.error("processRecording error:", error);
        res.status(500).json({ error: error.message ?? "Internal error" });
    }
});
//# sourceMappingURL=processRecording.js.map