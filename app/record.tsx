import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import { createRecording } from '@/src/db/recordings';
import { processRecording } from '@/src/services/pipeline';
import { invalidateDB } from '@/src/db/hooks';
import { useRecordingSessionStore } from '@/src/stores/useRecordingSessionStore';

const MAX_DURATION = 300; // 5 minutes

export default function RecordScreen() {
  const router = useRouter();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isRecording, elapsedTime, currentAmplitude, setIsRecording, setElapsedTime, setCurrentAmplitude, reset } = useRecordingSessionStore();

  useEffect(() => {
    checkApiKey();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      reset();
    };
  }, []);

  const checkApiKey = async () => {
    const key = await SecureStore.getItemAsync('google_cloud_api_key');
    if (!key) {
      Alert.alert(
        'API 키 필요',
        '녹음은 가능하지만, 영어 변환을 위해 Settings에서 Google Cloud API 키를 설정해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: 4, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'aac',
          audioQuality: 127, // MAX
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {},
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      timerRef.current = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          const secs = Math.floor((status.durationMillis ?? 0) / 1000);
          setElapsedTime(secs);
          setCurrentAmplitude(status.metering ?? -160);

          if (secs >= MAX_DURATION) {
            await stopAndSave();
          }
        }
      }, 200);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('녹음 오류', '마이크 권한을 확인해주세요.');
    }
  }, []);

  const stopAndSave = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await recordingRef.current.stopAndUnloadAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const uri = recordingRef.current.getURI();
      if (!uri) throw new Error('No recording URI');

      const status = await recordingRef.current.getStatusAsync();
      const duration = (status.durationMillis ?? 0) / 1000;

      const id = await createRecording(uri, duration);
      invalidateDB();

      recordingRef.current = null;
      reset();

      // Process in background
      processRecording(id).catch(console.error);
      router.back();
    } catch (err) {
      console.error('Failed to save recording:', err);
      Alert.alert('저장 오류', '녹음 저장에 실패했습니다.');
    }
  }, []);

  const cancel = useCallback(async () => {
    if (recordingRef.current) {
      if (timerRef.current) clearInterval(timerRef.current);
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    reset();
    router.back();
  }, []);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return { m, s };
  };

  const { m, s } = formatTime(elapsedTime);
  const normalizedAmp = Math.max(0, Math.min(1, (currentAmplitude + 60) / 60));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={cancel} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#818cf8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily English</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Practicing: Daily Routine</Text>
        <Text style={styles.subtitle}>SPEAK CLEARLY INTO THE MICROPHONE</Text>

        {/* Timer */}
        <Text style={styles.timer}>
          {m}:<Text style={styles.timerAccent}>{s}</Text>
        </Text>

        {/* Mic Button */}
        <TouchableOpacity
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
          onPress={isRecording ? stopAndSave : startRecording}
          activeOpacity={0.8}
        >
          <MaterialIcons name="mic" size={48} color="#fff" />
        </TouchableOpacity>

        {/* Waveform */}
        <View style={styles.waveform}>
          {Array.from({ length: 15 }).map((_, i) => {
            const h = isRecording
              ? 8 + normalizedAmp * 40 * Math.abs(Math.sin((i + elapsedTime) * 0.7))
              : 4;
            return (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: h },
                  i % 3 === 0 && { backgroundColor: '#ac3509' },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.stopBtn}
          onPress={stopAndSave}
          activeOpacity={0.8}
          disabled={!isRecording}
        >
          <MaterialIcons name="save" size={20} color="#fff" />
          <Text style={styles.stopBtnText}>Stop & Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={cancel} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  backBtn: { padding: 8 },
  headerTitle: { fontFamily: 'Manrope-Bold', fontSize: 20, color: '#818cf8', letterSpacing: -0.5 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  headline: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 },
  timer: { fontFamily: 'Manrope-ExtraBold', fontSize: 64, color: '#fff', letterSpacing: -2, marginTop: 40 },
  timerAccent: { color: '#ac3509' },
  micBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ac3509', alignItems: 'center', justifyContent: 'center', marginTop: 40, shadowColor: 'rgba(172,53,9,0.3)', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 40, elevation: 12 },
  micBtnActive: { backgroundColor: '#dc4a1a' },
  waveform: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 48, marginTop: 32 },
  waveBar: { width: 4, borderRadius: 4, backgroundColor: '#8690ee' },
  actions: { paddingHorizontal: 24, paddingBottom: 48, gap: 12 },
  stopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ac3509', paddingVertical: 18, borderRadius: 12 },
  stopBtnText: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  cancelBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#94a3b8' },
});
