export type RecordingStatus =
  | 'recorded'
  | 'stt_processing'
  | 'stt_done'
  | 'translating'
  | 'translated'
  | 'extracting'
  | 'ready'
  | 'error';

export interface Recording {
  id: number;
  title: string | null;
  audio_uri: string;
  duration: number | null;
  korean_transcript: string | null;
  english_translation: string | null;
  status: RecordingStatus;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}
