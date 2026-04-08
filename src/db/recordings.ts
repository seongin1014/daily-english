import { getDatabase } from './schema';
import type { Recording, RecordingStatus } from '../types/recording';

export async function createRecording(audioUri: string, duration: number | null, title?: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO recordings (audio_uri, duration, title, status) VALUES (?, ?, ?, ?)',
    audioUri, duration, title ?? null, 'recorded'
  );
  return result.lastInsertRowId;
}

export async function getRecording(id: number): Promise<Recording | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Recording>('SELECT * FROM recordings WHERE id = ?', id);
}

export async function getAllRecordings(): Promise<Recording[]> {
  const db = await getDatabase();
  return db.getAllAsync<Recording>('SELECT * FROM recordings ORDER BY created_at DESC');
}

export async function updateRecordingStatus(
  id: number,
  status: RecordingStatus,
  errorMessage?: string
): Promise<void> {
  const db = await getDatabase();
  if (status === 'error' && errorMessage) {
    await db.runAsync(
      'UPDATE recordings SET status = ?, error_message = ?, retry_count = retry_count + 1 WHERE id = ?',
      status, errorMessage, id
    );
  } else {
    await db.runAsync(
      'UPDATE recordings SET status = ?, error_message = NULL WHERE id = ?',
      status, id
    );
  }
}

export async function updateRecordingTranscript(id: number, koreanTranscript: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE recordings SET korean_transcript = ?, status = ? WHERE id = ?',
    koreanTranscript, 'stt_done', id
  );
}

export async function updateRecordingTranslation(id: number, englishTranslation: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE recordings SET english_translation = ?, status = ? WHERE id = ?',
    englishTranslation, 'translated', id
  );
}

export async function getPendingRecordings(): Promise<Recording[]> {
  const db = await getDatabase();
  return db.getAllAsync<Recording>(
    "SELECT * FROM recordings WHERE status NOT IN ('ready', 'error') AND retry_count < 3 ORDER BY created_at ASC"
  );
}

export async function deleteRecording(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recordings WHERE id = ?', id);
}
