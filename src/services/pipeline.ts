import { getRecording, updateRecordingStatus, updateRecordingTranscript, updateRecordingTranslation, getPendingRecordings } from '../db/recordings';
import { createExpression } from '../db/expressions';
import { invalidateDB } from '../db/hooks';
import { transcribeAudio } from './stt';
import { translateText, translateSentences } from './translate';
import { extractExpressions, splitSentences } from './extract';
import type { RecordingStatus } from '../types/recording';

/**
 * Processing state machine:
 * recorded → stt_processing → stt_done → translating → translated → extracting → ready
 *                                                                                  ↓
 *                                                                                error
 */
export async function processRecording(recordingId: number): Promise<void> {
  const recording = await getRecording(recordingId);
  if (!recording) throw new Error(`Recording ${recordingId} not found`);

  try {
    // Resume from last completed step
    if (['recorded', 'stt_processing'].includes(recording.status)) {
      await updateRecordingStatus(recordingId, 'stt_processing');
      invalidateDB();

      const transcript = await transcribeAudio(recording.audio_uri, recording.duration ?? 0);
      await updateRecordingTranscript(recordingId, transcript);
      invalidateDB();
    }

    // Get fresh state
    const afterSTT = await getRecording(recordingId);
    if (!afterSTT?.korean_transcript) throw new Error('No transcript available');

    if (['stt_done', 'translating'].includes(afterSTT.status)) {
      await updateRecordingStatus(recordingId, 'translating');
      invalidateDB();

      // Translate full text for display
      const fullTranslation = await translateText(afterSTT.korean_transcript);
      await updateRecordingTranslation(recordingId, fullTranslation);
      invalidateDB();
    }

    const afterTranslate = await getRecording(recordingId);
    if (!afterTranslate?.korean_transcript) throw new Error('No transcript');

    if (['translated', 'extracting'].includes(afterTranslate.status)) {
      await updateRecordingStatus(recordingId, 'extracting');
      invalidateDB();

      // Split into sentences and translate individually for precise pairing
      const koreanSentences = splitSentences(afterTranslate.korean_transcript);
      const englishSentences = await translateSentences(koreanSentences);

      // Extract expression pairs
      const expressions = extractExpressions(koreanSentences, englishSentences);

      // Save expressions to DB
      for (const expr of expressions) {
        await createExpression(
          recordingId,
          expr.korean,
          expr.english,
          expr.contextKorean,
          expr.contextEnglish,
          expr.difficulty,
          true // is_auto_extracted
        );
      }

      await updateRecordingStatus(recordingId, 'ready');
      invalidateDB();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateRecordingStatus(recordingId, 'error', message);
    invalidateDB();
    throw error;
  }
}

/**
 * Resume any pending pipelines on app startup.
 * Called from _layout.tsx on mount.
 */
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
