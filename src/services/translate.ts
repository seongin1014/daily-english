import * as SecureStore from 'expo-secure-store';

const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

async function getApiKey(): Promise<string> {
  const key = await SecureStore.getItemAsync('google_cloud_api_key');
  if (!key) throw new Error('Google Cloud API key not configured');
  return key;
}

export async function translateText(text: string, source: string = 'ko', target: string = 'en'): Promise<string> {
  const apiKey = await getApiKey();

  const response = await fetch(`${TRANSLATE_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Translate API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data?.translations?.[0]?.translatedText ?? '';
}

export async function translateSentences(sentences: string[]): Promise<string[]> {
  const apiKey = await getApiKey();

  const response = await fetch(`${TRANSLATE_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: sentences,
      source: 'ko',
      target: 'en',
      format: 'text',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Translate API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data?.translations?.map((t: { translatedText: string }) => t.translatedText) ?? [];
}
