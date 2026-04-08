import * as admin from "firebase-admin";

admin.initializeApp();

// Export Cloud Functions
export { processRecording } from "./processRecording";
export { processLongRecording } from "./processLongRecording";

// Translate endpoint (for pipeline step 2 — when STT is already cached)
import { onRequest } from "firebase-functions/v2/https";
import { verifyAuth } from "./middleware/auth";

const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

export const translate = onRequest(
  { region: "asia-northeast3", memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const uid = await verifyAuth(req, res);
    if (!uid) return;

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
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      let sentences: { korean: string; english: string }[] = [];
      if (koreanSentences.length > 0) {
        const batchRes = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: koreanSentences, source: "ko", target: "en", format: "text" }),
        });
        const batchData = await batchRes.json();
        const englishSentences = batchData.data?.translations?.map((t: any) => t.translatedText) ?? [];
        sentences = koreanSentences.map((k: string, i: number) => ({
          korean: k,
          english: englishSentences[i] ?? "",
        }));
      }

      res.status(200).json({ englishTranslation, sentences });
    } catch (error: any) {
      res.status(500).json({ error: error.message ?? "Internal error" });
    }
  }
);
