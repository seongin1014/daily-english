import * as FileSystem from 'expo-file-system';
import { authenticatedFetch } from './api';
import { auth, storage } from './firebase';
import { ref, uploadBytes } from 'firebase/storage';

/**
 * Transcribe audio via Cloud Function proxy.
 * - <60s: send base64 directly to processRecording function
 * - >=60s: upload to Cloud Storage, send storagePath to processLongRecording function
 */
export async function transcribeAudio(audioUri: string, durationSeconds: number): Promise<string> {
  if (durationSeconds >= 60) {
    return transcribeLong(audioUri);
  }
  return transcribeShort(audioUri);
}

async function transcribeShort(audioUri: string): Promise<string> {
  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: 'base64',
  });

  const res = await authenticatedFetch('/processRecording', {
    audio: audioBase64,
    type: 'short',
  });

  if (!res.ok) {
    if (res.status === 403) throw new Error('USAGE_LIMIT_EXCEEDED');
    const error = await res.text();
    throw new Error(`STT error: ${res.status} - ${error}`);
  }

  const data = await res.json();
  return data.koreanTranscript ?? '';
}

async function transcribeLong(audioUri: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  // Upload to Cloud Storage
  const fileName = `audio/${uid}/${Date.now()}.m4a`;
  const storageRef = ref(storage, fileName);
  const response = await fetch(audioUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);

  // Call Cloud Function with storage path (gs:// URI used server-side)
  const res = await authenticatedFetch('/processLongRecording', {
    storagePath: fileName,
    type: 'long',
  });

  if (!res.ok) {
    if (res.status === 403) throw new Error('USAGE_LIMIT_EXCEEDED');
    const error = await res.text();
    throw new Error(`STT Long error: ${res.status} - ${error}`);
  }

  const data = await res.json();
  return data.koreanTranscript ?? '';
}

/**
 * Translate + get sentence pairs via Cloud Function.
 */
export async function translateViaServer(koreanTranscript: string): Promise<{
  englishTranslation: string;
  sentences: { korean: string; english: string }[];
}> {
  const res = await authenticatedFetch('/translate', {
    text: koreanTranscript,
  });

  if (!res.ok) {
    throw new Error(`Translate error: ${res.status}`);
  }

  return res.json();
}
