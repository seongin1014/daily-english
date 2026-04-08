import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

const STT_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';
const LONG_STT_ENDPOINT = 'https://speech.googleapis.com/v1/speech:longrunningrecognize';

async function getApiKey(): Promise<string> {
  const key = await SecureStore.getItemAsync('google_cloud_api_key');
  if (!key) throw new Error('Google Cloud API key not configured');
  return key;
}

export async function transcribeAudio(audioUri: string, durationSeconds: number): Promise<string> {
  const apiKey = await getApiKey();
  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: 'base64',
  });

  // Use longrunningrecognize for audio > 60 seconds
  if (durationSeconds > 60) {
    return transcribeLong(audioBase64, apiKey);
  }

  const response = await fetch(`${STT_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config: {
        encoding: 'MP4_AAC',
        sampleRateHertz: 16000,
        languageCode: 'ko-KR',
        model: 'latest_long',
        enableAutomaticPunctuation: true,
      },
      audio: { content: audioBase64 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`STT API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const transcript = data.results
    ?.map((r: { alternatives: { transcript: string }[] }) => r.alternatives[0]?.transcript)
    .filter(Boolean)
    .join(' ') ?? '';

  return transcript;
}

async function transcribeLong(audioBase64: string, apiKey: string): Promise<string> {
  // Start long-running operation
  const response = await fetch(`${LONG_STT_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config: {
        encoding: 'MP4_AAC',
        sampleRateHertz: 16000,
        languageCode: 'ko-KR',
        model: 'latest_long',
        enableAutomaticPunctuation: true,
      },
      audio: { content: audioBase64 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`STT Long API error: ${response.status} - ${error}`);
  }

  const operation = await response.json();
  const operationName = operation.name;

  // Poll for completion every 2 seconds
  const pollUrl = `https://speech.googleapis.com/v1/operations/${operationName}?key=${apiKey}`;
  for (let i = 0; i < 60; i++) { // max 2 minutes
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pollResponse = await fetch(pollUrl);
    const pollData = await pollResponse.json();

    if (pollData.done) {
      if (pollData.error) {
        throw new Error(`STT Long operation error: ${pollData.error.message}`);
      }
      const transcript = pollData.response?.results
        ?.map((r: { alternatives: { transcript: string }[] }) => r.alternatives[0]?.transcript)
        .filter(Boolean)
        .join(' ') ?? '';
      return transcript;
    }
  }

  throw new Error('STT Long operation timed out');
}
