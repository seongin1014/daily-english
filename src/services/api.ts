import { getIdToken } from './firebase';

// 2nd gen Cloud Functions use individual Cloud Run URLs
const FUNCTION_URLS: Record<string, string> = {
  '/processRecording': 'https://processrecording-h34urlpcya-du.a.run.app',
  '/processLongRecording': 'https://asia-northeast3-echoling-5b2ef.cloudfunctions.net/processLongRecording',
  '/translate': 'https://translate-h34urlpcya-du.a.run.app',
};

export async function authenticatedFetch(
  path: string,
  body: object,
  retries = 2
): Promise<Response> {
  const url = FUNCTION_URLS[path];
  if (!url) throw new Error(`Unknown function path: ${path}`);

  for (let i = 0; i <= retries; i++) {
    const token = await getIdToken(i > 0);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 && i < retries) continue;
    return res;
  }

  throw new Error('Authentication failed after retries');
}
