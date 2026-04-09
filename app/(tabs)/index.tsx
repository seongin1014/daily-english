import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { useRecordings, useDueCardCount, useExpressionCount, useTodayExpressionCount, useStreak, useTodayReviewCount, useSetting } from '@/src/db/hooks';
import { useAppStore } from '@/src/stores/useAppStore';
import { FocusPlate } from '@/src/components/ui/FocusPlate';
import { Card } from '@/src/components/ui/Card';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Badge } from '@/src/components/ui/Badge';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: recordings } = useRecordings();
  const { data: dueCount } = useDueCardCount();
  const { data: totalExpressions } = useExpressionCount();
  const { data: todayCount } = useTodayExpressionCount();
  const { data: streak } = useStreak();
  const { data: todayReviewed } = useTodayReviewCount();
  const { subscription, monthlyUsage, monthlyLimit } = useAppStore();
  const { data: savedGoal } = useSetting('daily_goal', '10');
  const dailyGoal = Number(savedGoal);
  const goalProgress = dailyGoal > 0 ? Math.min(1, todayReviewed / dailyGoal) : 0;
  const remaining = Math.max(0, monthlyLimit - monthlyUsage);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const recentRecordings = recordings.slice(0, 3);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>EchoLing</Text>
            <Text style={styles.subtitle}>일상이 영어로 돌아오다</Text>
          </View>
        </View>

        {/* Usage Badge */}
        <View style={styles.usageBadge}>
          {subscription === 'pro' ? (
            <Text style={styles.usagePro}>Pro</Text>
          ) : (
            <Text style={styles.usageFree}>이번 달 {remaining}회 남음</Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Streak Card */}
          <Card variant="surfaceLow" style={styles.streakCard}>
            <Text style={styles.streakLabel}>연속 학습</Text>
            <View style={styles.streakValue}>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakUnit}>일째</Text>
            </View>
            <View style={{ marginTop: 24 }}>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>오늘 목표</Text>
                <Text style={styles.goalLabel}>{todayReviewed}/{dailyGoal}</Text>
              </View>
              <ProgressBar progress={goalProgress} />
            </View>
          </Card>

          {/* Total Expressions */}
          <Card variant="primary" style={styles.totalCard}>
            <Text style={styles.totalLabel}>전체 표현</Text>
            <Text style={styles.totalNumber}>{totalExpressions}</Text>
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>오늘 +{todayCount}</Text>
              <MaterialIcons name="trending-up" size={14} color="#fff" />
            </View>
          </Card>
        </View>

        {/* Today's Review */}
        <FocusPlate style={{ marginTop: 16 }}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>오늘의 복습</Text>
            <MaterialIcons name="menu-book" size={24} color={colors.secondary} />
          </View>
          <Text style={styles.reviewDesc}>
            복습할 카드가 <Text style={{ color: colors.primary, fontFamily: 'Pretendard-Bold' }}>{dueCount}개</Text> 있어요. 꾸준히 복습해서 기억력을 유지하세요!
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push('/flashcard')}
            activeOpacity={0.8}
          >
            <Text style={styles.startBtnText}>학습 시작하기</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </FocusPlate>

        {/* Recent Recordings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 녹음</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/recordings')}>
            <Text style={styles.viewAll}>전체 보기</Text>
          </TouchableOpacity>
        </View>

        {recentRecordings.length === 0 ? (
          <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
            <MaterialIcons name="mic-none" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>녹음이 아직 없어요</Text>
            <Text style={styles.emptySubtext}>마이크 버튼을 눌러 시작해보세요!</Text>
          </Card>
        ) : (
          recentRecordings.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              onPress={() => router.push(`/recording/${rec.id}`)}
              activeOpacity={0.7}
            >
              <Card style={styles.recordingItem}>
                <View style={styles.recordingLeft}>
                  <View style={styles.recordingIcon}>
                    <MaterialIcons name="mic" size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.recordingTitle}>{rec.title || `녹음`}</Text>
                    <Text style={styles.recordingDate}>{new Date(rec.created_at).toLocaleDateString('ko-KR')}</Text>
                  </View>
                </View>
                <Badge variant={rec.status === 'ready' ? 'ready' : rec.status === 'error' ? 'error' : 'processing'} />
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Tip of the Day */}
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>오늘의 팁</Text>
          <Text style={styles.tipQuote}>"영어를 공부하지 말고, 영어로 살아보세요."</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Quick Record FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/record')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="mic" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  appTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: colors.primary, letterSpacing: -0.8 },
  subtitle: { fontFamily: 'Inter-Medium', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 },
statsRow: { flexDirection: 'row', gap: 12 },
  streakCard: { flex: 1, padding: 20 },
  streakLabel: { fontFamily: 'Pretendard-SemiBold', fontSize: 11, color: colors.secondary, letterSpacing: 1 },
  streakValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  streakNumber: { fontFamily: 'Manrope-ExtraBold', fontSize: 48, color: colors.primary, letterSpacing: -1 },
  streakUnit: { fontFamily: 'Pretendard-Bold', fontSize: 20, color: colors.primaryContainer },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLabel: { fontFamily: 'Pretendard-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 0.5 },
  totalCard: { flex: 1, padding: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 },
  totalLabel: { fontFamily: 'Pretendard-SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  totalNumber: { fontFamily: 'Manrope-ExtraBold', fontSize: 48, color: '#fff', letterSpacing: -1, marginTop: 8 },
  todayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  todayText: { fontFamily: 'Pretendard-SemiBold', fontSize: 11, color: '#fff', letterSpacing: 0.5 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewTitle: { fontFamily: 'Pretendard-Bold', fontSize: 18, color: colors.onSurface },
  reviewDesc: { fontFamily: 'Pretendard', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 22, marginBottom: 20 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.secondary, paddingVertical: 16, borderRadius: 12 },
  startBtnText: { fontFamily: 'Pretendard-Bold', fontSize: 16, color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: 'Pretendard-ExtraBold', fontSize: 22, color: colors.primary, letterSpacing: -0.5 },
  viewAll: { fontFamily: 'Pretendard-SemiBold', fontSize: 13, color: colors.primaryContainer },
  recordingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 8 },
  recordingLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  recordingIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  recordingTitle: { fontFamily: 'Pretendard-Bold', fontSize: 15, color: colors.onSurface },
  recordingDate: { fontFamily: 'Pretendard', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  emptyText: { fontFamily: 'Pretendard-Bold', fontSize: 16, color: colors.onSurfaceVariant, marginTop: 12 },
  emptySubtext: { fontFamily: 'Pretendard', fontSize: 13, color: colors.outline, marginTop: 4 },
  tipCard: { marginTop: 32, padding: 32, borderRadius: 28, backgroundColor: colors.primaryContainer, alignItems: 'center' },
  tipLabel: { fontFamily: 'Pretendard-SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, marginBottom: 16 },
  tipQuote: { fontFamily: 'Pretendard-ExtraBold', fontSize: 22, color: '#fff', textAlign: 'center', fontStyle: 'italic', lineHeight: 32 },
  usageBadge: { alignSelf: 'flex-end', marginBottom: 12 },
  usagePro: { fontFamily: 'Pretendard-Bold', fontSize: 12, color: colors.secondary, backgroundColor: colors.secondaryFixed, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  usageFree: { fontFamily: 'Pretendard-Medium', fontSize: 12, color: colors.onSurfaceVariant, backgroundColor: colors.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  fab: { position: 'absolute', right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(172,53,9,0.4)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 32, elevation: 12 },
});
