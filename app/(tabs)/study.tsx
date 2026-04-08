import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useDueCardCount, useStudyStats } from '@/src/db/hooks';
import { Card } from '@/src/components/ui/Card';

export default function StudyHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: dueCount } = useDueCardCount();
  const { data: stats } = useStudyStats();
  const masteryPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>학습 허브</Text>
          <TouchableOpacity>
            <MaterialIcons name="notifications" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Today's Review CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaLabel}>READY TO STUDY?</Text>
          <Text style={styles.ctaTitle}>오늘의 복습 - {dueCount}개 남음</Text>
          <Text style={styles.ctaDesc}>Yesterday's vocabulary is still fresh. Solidify your memory with a quick 5-minute review session.</Text>
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
          <Text style={styles.sectionTitle}>Mastery Levels</Text>
          <View style={styles.donutContainer}>
            <View style={styles.donutOuter}>
              <Text style={styles.donutPct}>{masteryPct}%</Text>
              <Text style={styles.donutLabel}>OVERALL</Text>
            </View>
          </View>
          <View style={styles.masteryRow}>
            <View style={styles.masteryItem}>
              <Text style={[styles.masteryCount, { color: colors.primary }]}>{stats.mastered}</Text>
              <Text style={styles.masteryLabel}>Mastered</Text>
            </View>
            <View style={styles.masteryItem}>
              <Text style={[styles.masteryCount, { color: colors.secondary }]}>{stats.learning}</Text>
              <Text style={styles.masteryLabel}>Learning</Text>
            </View>
            <View style={styles.masteryItem}>
              <Text style={[styles.masteryCount, { color: colors.outline }]}>{stats.newCards}</Text>
              <Text style={styles.masteryLabel}>New</Text>
            </View>
          </View>
        </Card>

        {/* Study Time */}
        <Card style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Text style={styles.sectionTitle}>Study Time</Text>
            <Text style={styles.timeAvg}>Weekly Average: 45m</Text>
          </View>
          <View style={styles.weekRow}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
              <View key={day} style={styles.dayCol}>
                <View style={[styles.dayBar, { height: 8 + Math.random() * 40, backgroundColor: i === 3 ? colors.secondary : colors.outlineVariant }]} />
                <Text style={[styles.dayLabel, i === 3 && { fontFamily: 'Inter-SemiBold', color: colors.onSurface }]}>{day}</Text>
              </View>
            ))}
          </View>
        </Card>

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
          <Text style={styles.wisdomTitle}>Today's Wisdom</Text>
          <Text style={styles.wisdomQuote}>"Language is the road map of a culture. It tells you where its people come from and where they are going."</Text>
          <Text style={styles.wisdomAuthor}>Teacher Sarah - Daily Tip</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Manrope-Bold', fontSize: 20, color: colors.primary },
  ctaCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: '#1a1c1c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  ctaLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.secondary, letterSpacing: 2, marginBottom: 8 },
  ctaTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 24, color: colors.onSurface, lineHeight: 32, marginBottom: 8 },
  ctaDesc: { fontFamily: 'Inter', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 22, marginBottom: 20 },
  ctaBtn: { backgroundColor: colors.secondary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  ctaBtnText: { fontFamily: 'Manrope-Bold', fontSize: 15, color: '#fff' },
  masteryCard: { marginBottom: 16 },
  sectionTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface, marginBottom: 16 },
  donutContainer: { alignItems: 'center', marginBottom: 20 },
  donutOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 10, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  donutPct: { fontFamily: 'Manrope-ExtraBold', fontSize: 32, color: colors.onSurface },
  donutLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 2, marginTop: 2 },
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
});
