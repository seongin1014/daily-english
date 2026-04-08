import { getRecording, updateRecordingStatus, updateRecordingTranscript, updateRecordingTranslation, getPendingRecordings } from '../db/recordings';
import { createExpression } from '../db/expressions';
import { invalidateDB } from '../db/hooks';
import { transcribeAudio, translateViaServer } from './stt';
import { extractExpressions, splitSentences } from './extract';

/**
 * Processing state machine (preserved):
 * recorded → stt_processing → stt_done → translating → translated → extracting → ready
 *
 * API calls go through Cloud Functions. Server responses cached in SQLite
 * so local extraction can retry without re-calling server.
 */
export async function processRecording(recordingId: number): Promise<void> {
  const recording = await getRecording(recordingId);
  if (!recording) throw new Error(`Recording ${recordingId} not found`);

  try {
    // Step 1: STT via Cloud Function
    if (['recorded', 'stt_processing'].includes(recording.status)) {
      await updateRecordingStatus(recordingId, 'stt_processing');
      invalidateDB();

      const transcript = await transcribeAudio(recording.audio_uri, recording.duration ?? 0);
      await updateRecordingTranscript(recordingId, transcript);
      invalidateDB();
    }

    // Step 2: Translate via Cloud Function
    const afterSTT = await getRecording(recordingId);
    if (!afterSTT?.korean_transcript) throw new Error('No transcript available');

    if (['stt_done', 'translating'].includes(afterSTT.status)) {
      await updateRecordingStatus(recordingId, 'translating');
      invalidateDB();

      const { englishTranslation, sentences } = await translateViaServer(afterSTT.korean_transcript);
      await updateRecordingTranslation(recordingId, englishTranslation);
      invalidateDB();

      // Step 3: Extract expressions locally
      await updateRecordingStatus(recordingId, 'extracting');
      invalidateDB();

      const koreanSentences = sentences.map(s => s.korean);
      const englishSentences = sentences.map(s => s.english);
      const expressions = extractExpressions(koreanSentences, englishSentences);

      for (const expr of expressions) {
        await createExpression(
          recordingId, expr.korean, expr.english,
          expr.contextKorean, expr.contextEnglish, expr.difficulty, true
        );
      }

      await updateRecordingStatus(recordingId, 'ready');
      invalidateDB();
      return;
    }

    // Resumability: if translation cached but extraction failed
    const afterTranslate = await getRecording(recordingId);
    if (afterTranslate && ['translated', 'extracting'].includes(afterTranslate.status)) {
      if (afterTranslate.korean_transcript && afterTranslate.english_translation) {
        await updateRecordingStatus(recordingId, 'extracting');
        invalidateDB();

        // Re-extract from cached data (no server call)
        const koreanSentences = splitSentences(afterTranslate.korean_transcript);
        const englishSentences = splitSentences(afterTranslate.english_translation);
        const expressions = extractExpressions(koreanSentences, englishSentences);

        for (const expr of expressions) {
          await createExpression(
            recordingId, expr.korean, expr.english,
            expr.contextKorean, expr.contextEnglish, expr.difficulty, true
          );
        }

        await updateRecordingStatus(recordingId, 'ready');
        invalidateDB();
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateRecordingStatus(recordingId, 'error', message);
    invalidateDB();
    throw error;
  }
}

export async function resumePendingPipelines(): Promise<void> {
  const pending = await getPendingRecordings();
  for (const recording of pending) {
    try {
      await processRecording(recording.id);
    } catch (error) {
      console.error(`Failed to resume pipeline for recording ${recording.id}:`, error);
    }
  }
}
