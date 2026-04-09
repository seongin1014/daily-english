import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { useDueCardCount, useStudyStats, useTodayReviewCount, useWeeklyActivity, useHardestExpressions } from '@/src/db/hooks';
import { Card } from '@/src/components/ui/Card';
import { DonutChart } from '@/src/components/ui/DonutChart';

export default function StudyHub() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: dueCount } = useDueCardCount();
  const { data: stats } = useStudyStats();
  const { data: todayReviewed } = useTodayReviewCount();
  const { data: weeklyActivity } = useWeeklyActivity();
  const { data: hardest } = useHardestExpressions(5);
  const maxWeekly = Math.max(...weeklyActivity, 1);
  const todayDayOfWeek = new Date().getDay();

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>학습 허브</Text>
        </View>

        {/* Today's Review CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaLabel}>오늘의 학습</Text>
          <Text style={styles.ctaTitle}>복습 카드 {dueCount}개</Text>
          <Text style={styles.ctaDesc}>어제 배운 표현이 아직 기억에 남아있을 때, 5분만 투자해서 복습해보세요.</Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/flashcard')}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaBtnText}>시작하기</Text>
          </TouchableOpacity>
        </View>

        {/* Mastery Levels */}
        <Card style={styles.masteryCard}>
          <Text style={styles.sectionTitle}>숙달 수준</Text>
          <View style={styles.donutContainer}>
            <DonutChart
              mastered={stats.mastered}
              learning={stats.learning}
              newCards={stats.newCards}
              colors={colors}
            />
          </View>
          <View style={styles.masteryRow}>
            <View style={styles.masteryItem}>
              <Text style={[styles.masteryCount, { color: colors.primary }]}>{stats.mastered}</Text>
              <Text style={styles.masteryLabel}>완료</Text>
            </View>
            <View style={styles.masteryItem}>
              <Text style={[styles.masteryCount, { color: colors.secondary }]}>{stats.learning}</Text>
              <Text style={styles.masteryLabel}>학습중</Text>
            </View>
            <View style={styles.masteryItem}>
              <Text style={[styles.masteryCount, { color: colors.outline }]}>{stats.newCards}</Text>
              <Text style={styles.masteryLabel}>새 표현</Text>
            </View>
          </View>
        </Card>

        {/* Study Time — shows actual data when available */}
        <Card style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Text style={styles.sectionTitle}>학습 현황</Text>
            <Text style={styles.timeAvg}>오늘 {todayReviewed}개 복습</Text>
          </View>
          <View style={styles.weekRow}>
            {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => {
              const count = weeklyActivity[i] ?? 0;
              const barH = maxWeekly > 0 ? Math.max(4, (count / maxWeekly) * 48) : 4;
              const dayIndex = i === 6 ? 0 : i + 1;
              const isToday = dayIndex === todayDayOfWeek;
              return (
                <View key={day} style={styles.dayCol}>
                  <View style={[styles.dayBar, { height: barH, backgroundColor: isToday ? colors.secondary : count > 0 ? colors.primaryFixedDim : colors.outlineVariant }]} />
                  <Text style={[styles.dayLabel, isToday && { fontFamily: 'Pretendard-Bold', color: colors.onSurface }]}>{day}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* 어려운 표현 Top 5 */}
        {hardest.length > 0 && (
          <>
            <Text style={styles.quizSectionTitle}>어려운 표현 Top {hardest.length}</Text>
            {hardest.map((expr, i) => (
              <View key={i} style={styles.hardItem}>
                <Text style={styles.hardRank}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hardKorean}>{expr.korean}</Text>
                  <Text style={styles.hardEnglish}>{expr.english}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Quiz Section */}
        <Text style={styles.quizSectionTitle}>퀴즈 학습</Text>

        <TouchableOpacity
          style={styles.quizItem}
          onPress={() => router.push('/quiz/multiple-choice')}
          activeOpacity={0.7}
        >
          <View style={[styles.quizIcon, { backgroundColor: colors.primaryFixed }]}>
            <MaterialIcons name="quiz" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quizTitle}>객관식 퀴즈</Text>
            <Text style={styles.quizDesc}>Multiple choice comprehension</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quizItem}
          onPress={() => router.push('/quiz/fill-blank')}
          activeOpacity={0.7}
        >
          <View style={[styles.quizIcon, { backgroundColor: colors.secondaryFixed }]}>
            <MaterialIcons name="edit" size={24} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.quizTitle}>빈칸 채우기</Text>
            <Text style={styles.quizDesc}>Contextual word placement</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
        </TouchableOpacity>

        {/* Wisdom Quote */}
        <View style={styles.wisdomCard}>
          <Text style={styles.wisdomTitle}>오늘의 한마디</Text>
          <Text style={styles.wisdomQuote}>"언어는 문화의 지도입니다. 그 사람들이 어디에서 왔고, 어디로 가는지를 알려줍니다."</Text>
          <Text style={styles.wisdomAuthor}>EchoLing 데일리 팁</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Manrope-Bold', fontSize: 20, color: colors.primary },
  ctaCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: colors.onSurface, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  ctaLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  ctaTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 24, color: colors.onSurface, lineHeight: 32, marginBottom: 8 },
  ctaDesc: { fontFamily: 'Inter', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 22, marginBottom: 20 },
  ctaBtn: { backgroundColor: colors.secondary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  ctaBtnText: { fontFamily: 'Manrope-Bold', fontSize: 15, color: '#fff' },
  masteryCard: { marginBottom: 16 },
  sectionTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface, marginBottom: 16 },
  donutContainer: { alignItems: 'center', marginBottom: 20 },
  masteryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  masteryItem: { alignItems: 'center' },
  masteryCount: { fontFamily: 'Manrope-ExtraBold', fontSize: 24 },
  masteryLabel: { fontFamily: 'Inter', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 4 },
  timeCard: { marginBottom: 24 },
  timeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timeAvg: { fontFamily: 'Inter-Medium', fontSize: 12, color: colors.onSurfaceVariant },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 60 },
  dayCol: { alignItems: 'center', gap: 6, flex: 1 },
  dayBar: { width: 16, borderRadius: 4 },
  dayLabel: { fontFamily: 'Inter', fontSize: 10, color: colors.onSurfaceVariant },
  quizSectionTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface, marginBottom: 12 },
  quizItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginBottom: 10 },
  quizIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quizTitle: { fontFamily: 'Manrope-Bold', fontSize: 15, color: colors.onSurface },
  quizDesc: { fontFamily: 'Inter', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  wisdomCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: 20, padding: 24, marginTop: 20 },
  wisdomTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface, marginBottom: 12 },
  wisdomQuote: { fontFamily: 'Inter', fontSize: 15, color: colors.onSurfaceVariant, lineHeight: 24, fontStyle: 'italic', marginBottom: 12 },
  wisdomAuthor: { fontFamily: 'Inter-Medium', fontSize: 12, color: colors.outline },
  hardItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, marginBottom: 8 },
  hardRank: { fontFamily: 'Manrope-ExtraBold', fontSize: 20, color: colors.secondary, width: 28, textAlign: 'center' },
  hardKorean: { fontFamily: 'Pretendard-Bold', fontSize: 15, color: colors.onSurface },
  hardEnglish: { fontFamily: 'Pretendard', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
});
