import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useRecording, useExpressions } from '@/src/db/hooks';
import { FocusPlate } from '@/src/components/ui/FocusPlate';
import { Badge } from '@/src/components/ui/Badge';
import type { Difficulty } from '@/src/types/expression';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: recording } = useRecording(Number(id));
  const { data: expressions } = useExpressions(Number(id));
  const [activeTab, setActiveTab] = useState<'translation' | 'expressions'>('expressions');

  if (!recording) return null;

  const dateStr = new Date(recording.created_at).toLocaleDateString('ko-KR');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>{dateStr} 녹음</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity><MaterialIcons name="share" size={22} color={colors.onSurface} /></TouchableOpacity>
          <TouchableOpacity><MaterialIcons name="more-vert" size={22} color={colors.onSurface} /></TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'translation' && styles.tabActive]}
          onPress={() => setActiveTab('translation')}
        >
          <Text style={[styles.tabText, activeTab === 'translation' && styles.tabTextActive]}>전체 번역</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expressions' && styles.tabActive]}
          onPress={() => setActiveTab('expressions')}
        >
          <Text style={[styles.tabText, activeTab === 'expressions' && styles.tabTextActive]}>핵심 표현</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Audio Player Placeholder */}
        <View style={styles.player}>
          <View style={styles.waveform}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={[styles.waveBar, { height: 8 + Math.random() * 24 }]} />
            ))}
          </View>
          <TouchableOpacity style={styles.playBtn}>
            <MaterialIcons name="play-arrow" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {activeTab === 'translation' ? (
          <View style={styles.translationContent}>
            {recording.korean_transcript ? (
              <>
                <Text style={styles.sectionLabel}>한국어 원문</Text>
                <Text style={styles.koreanText}>{recording.korean_transcript}</Text>
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>English Translation</Text>
                <Text style={styles.englishText}>{recording.english_translation || 'Processing...'}</Text>
              </>
            ) : (
              <Text style={styles.processingText}>변환 처리 중...</Text>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.expressionCount}>EXPRESSIONS FOUND ({expressions.length})</Text>
            {expressions.map((expr) => (
              <View key={expr.id} style={styles.exprCard}>
                <View style={styles.exprCardAccent} />
                <View style={styles.exprContent}>
                  <View style={styles.exprHeader}>
                    <Badge variant={expr.difficulty as Difficulty} />
                    <TouchableOpacity>
                      <MaterialIcons name="bookmark-outline" size={22} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.exprKorean}>{expr.korean}</Text>
                  <Text style={styles.exprEnglish}>{expr.english}</Text>
                  {expr.context_korean && (
                    <View style={styles.contextBox}>
                      <Text style={styles.contextLabel}>Context Example</Text>
                      <Text style={styles.contextKorean}>"{expr.context_korean}"</Text>
                      {expr.context_english && (
                        <Text style={styles.contextEnglish}>"{expr.context_english}"</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))}

            {expressions.length > 0 && (
              <View style={styles.tipCard}>
                <Text style={styles.tipLabel}>DAILY REVIEW TIP</Text>
                <Text style={styles.tipText}>Practice these {expressions.length} phrases aloud to build muscle memory.</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 },
  title: { fontFamily: 'Manrope-Bold', fontSize: 16, color: colors.onSurface },
  headerRight: { flexDirection: 'row', gap: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 0 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onSurface, fontFamily: 'Inter-SemiBold' },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  player: { backgroundColor: colors.surfaceContainerLow, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 40 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: colors.outlineVariant },
  playBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  translationContent: { paddingVertical: 8 },
  sectionLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  koreanText: { fontFamily: 'Inter', fontSize: 16, color: colors.onSurface, lineHeight: 26 },
  englishText: { fontFamily: 'Inter', fontSize: 16, color: colors.onSurface, lineHeight: 26 },
  processingText: { fontFamily: 'Inter', fontSize: 16, color: colors.outline, textAlign: 'center', paddingVertical: 48 },
  expressionCount: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 16 },
  exprCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', marginBottom: 16, shadowColor: '#1a1c1c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  exprCardAccent: { width: 4, backgroundColor: colors.primaryContainer },
  exprContent: { flex: 1, padding: 20 },
  exprHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exprKorean: { fontFamily: 'Manrope-ExtraBold', fontSize: 24, color: colors.onSurface, marginBottom: 6 },
  exprEnglish: { fontFamily: 'Inter', fontSize: 16, color: colors.onSurfaceVariant, marginBottom: 16 },
  contextBox: { backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 16 },
  contextLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  contextKorean: { fontFamily: 'Inter', fontSize: 14, color: colors.onSurface, lineHeight: 22 },
  contextEnglish: { fontFamily: 'Inter', fontSize: 14, color: colors.onSurfaceVariant, fontStyle: 'italic', lineHeight: 22, marginTop: 4 },
  tipCard: { backgroundColor: colors.primaryContainer, borderRadius: 16, padding: 24, marginTop: 16 },
  tipLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  tipText: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#fff', lineHeight: 26 },
});
