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
exports.translate = exports.processLongRecording = exports.processRecording = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Export Cloud Functions
var processRecording_1 = require("./processRecording");
Object.defineProperty(exports, "processRecording", { enumerable: true, get: function () { return processRecording_1.processRecording; } });
var processLongRecording_1 = require("./processLongRecording");
Object.defineProperty(exports, "processLongRecording", { enumerable: true, get: function () { return processLongRecording_1.processLongRecording; } });
// Translate endpoint (for pipeline step 2 — when STT is already cached)
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("./middleware/auth");
const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";
exports.translate = (0, https_1.onRequest)({ region: "asia-northeast3", memory: "256MiB", timeoutSeconds: 60, secrets: ["GOOGLE_CLOUD_API_KEY"] }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    const uid = await (0, auth_1.verifyAuth)(req, res);
    if (!uid)
        return;
    const { text } = req.body;
    if (!text) {
        res.status(400).json({ error: "Missing text" });
        return;
    }
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "Server API key not configured" });
        return;
    }
    try {
        // Full translation
        const fullRes = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: text, source: "ko", target: "en", format: "text" }),
        });
        const fullData = await fullRes.json();
        const englishTranslation = fullData.data?.translations?.[0]?.translatedText ?? "";
        // Sentence pairs
        const koreanSentences = text
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
        res.status(200).json({ englishTranslation, sentences });
    }
    catch (error) {
        res.status(500).json({ error: error.message ?? "Internal error" });
    }
});
//# sourceMappingURL=index.js.map