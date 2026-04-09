import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { useDueCards, useExpressionCount, invalidateDB } from '@/src/db/hooks';
import { updateReview } from '@/src/db/reviews';
import { calculateNextReview, buttonToQuality, type SRButtonType } from '@/src/lib/sm2';
import { useStudySessionStore } from '@/src/stores/useStudySessionStore';
import { ProgressBar } from '@/src/components/ui/ProgressBar';

export default function FlashcardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: cards } = useDueCards();
  const { data: totalExpressions } = useExpressionCount();
  const { currentCardIndex, isFlipped, sessionScore, totalCards, setIsFlipped, setTotalCards, nextCard, incrementScore, reset } = useStudySessionStore();

  const SR_BUTTONS: { key: SRButtonType; label: string; icon: string; color: string; bg: string }[] = useMemo(() => [
    { key: 'again', label: '다시', icon: 'refresh', color: colors.error, bg: colors.surfaceContainerLow },
    { key: 'hard', label: '어려움', icon: 'sentiment-neutral', color: colors.secondary, bg: colors.surfaceContainerLow },
    { key: 'good', label: '괜찮음', icon: 'sentiment-satisfied', color: colors.primary, bg: colors.primaryFixed },
    { key: 'easy', label: '쉬움', icon: 'sentiment-very-satisfied', color: colors.primaryContainer, bg: colors.surfaceContainerLow },
  ], [colors]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (cards.length > 0) setTotalCards(cards.length);
    return () => reset();
  }, [cards.length]);

  const card = cards[currentCardIndex];
  const isComplete = totalCards > 0 && currentCardIndex >= cards.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRate = async (button: SRButtonType) => {
    if (!card) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const quality = buttonToQuality(button);
    const result = calculateNextReview(quality, {
      easeFactor: card.ease_factor,
      interval: card.interval,
      repetitions: card.repetitions,
    });
    await updateReview(card.expression_id, result.easeFactor, result.interval, result.repetitions, result.nextReview);
    invalidateDB();
    if (quality >= 3) incrementScore();
    nextCard();
  };

  if (isComplete) {
    return (
      <View style={styles.completeContainer}>
        <MaterialIcons name="celebration" size={64} color={colors.secondary} />
        <Text style={styles.completeTitle}>학습 완료!</Text>
        <Text style={styles.completeScore}>{sessionScore} / {totalCards} 정답</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>완료</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!card) {
    const hasNoExpressions = totalExpressions === 0;
    return (
      <View style={styles.completeContainer}>
        <MaterialIcons
          name={hasNoExpressions ? 'mic-none' : 'check-circle'}
          size={64}
          color={hasNoExpressions ? colors.outline : colors.primary}
        />
        <Text style={styles.completeTitle}>
          {hasNoExpressions ? '아직 표현이 없어요' : '오늘 복습 완료!'}
        </Text>
        <Text style={styles.completeScore}>
          {hasNoExpressions
            ? '녹음을 시작해서 영어 표현을 만들어보세요'
            : '오늘 복습할 카드를 모두 마쳤어요'}
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => hasNoExpressions ? router.replace('/record') : router.back()}
        >
          <Text style={styles.doneBtnText}>
            {hasNoExpressions ? '녹음 시작하기' : '돌아가기'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EchoLing</Text>
        <Text style={styles.headerLabel}>FLASHCARDS</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          <Text style={styles.progressBold}>{currentCardIndex + 1}</Text> / {totalCards}
        </Text>
        <Text style={styles.progressLabel}>SESSION PROGRESS</Text>
      </View>
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <ProgressBar progress={(currentCardIndex + 1) / totalCards} />
      </View>

      {/* Card */}
      <TouchableOpacity style={styles.cardOuter} onPress={handleFlip} activeOpacity={0.95}>
        <View style={styles.cardAccent} />
        <View style={styles.cardContent}>
          {!isFlipped ? (
            <>
              <Text style={styles.cardKorean}>{card.korean}</Text>
              <View style={styles.contextBox}>
                <Text style={styles.contextText}>"{card.context_korean}"</Text>
                <Text style={styles.contextHint}>Context: Informal conversation</Text>
              </View>
              <View style={styles.flipHint}>
                <MaterialIcons name="touch-app" size={24} color={colors.outline} />
                <Text style={styles.flipHintText}>TAP TO SEE TRANSLATION</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.cardEnglish}>{card.english}</Text>
              <View style={styles.contextBox}>
                <Text style={styles.contextText}>"{card.context_english}"</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* SR Buttons */}
      <View style={styles.srRow}>
        {SR_BUTTONS.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={[styles.srBtn, { backgroundColor: btn.bg }]}
            onPress={() => handleRate(btn.key)}
            activeOpacity={0.7}
          >
            <MaterialIcons name={btn.icon as any} size={24} color={btn.color} />
            <Text style={[styles.srLabel, { color: btn.key === 'good' ? colors.onPrimaryFixed : colors.onSurfaceVariant }]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 24 },
  headerTitle: { fontFamily: 'Manrope-Bold', fontSize: 20, color: colors.primaryContainer },
  headerLabel: { fontFamily: 'Inter-Medium', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 8 },
  progressText: { fontFamily: 'Manrope-ExtraBold', fontSize: 24, color: colors.primary },
  progressBold: { fontSize: 24 },
  progressLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.secondary, letterSpacing: 1 },
  cardOuter: { flex: 1, marginHorizontal: 24, marginBottom: 16, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#1a1c1c', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.06, shadowRadius: 32, elevation: 4 },
  cardAccent: { width: 6, backgroundColor: colors.primaryContainer },
  cardContent: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  cardKorean: { fontFamily: 'Manrope-ExtraBold', fontSize: 36, color: colors.primary, textAlign: 'center', marginBottom: 24 },
  cardEnglish: { fontFamily: 'Manrope-ExtraBold', fontSize: 32, color: colors.secondary, textAlign: 'center', marginBottom: 24 },
  contextBox: { backgroundColor: colors.surfaceContainerLow, padding: 20, borderRadius: 12, width: '100%' },
  contextText: { fontFamily: 'Inter', fontSize: 16, color: colors.onSurfaceVariant, lineHeight: 24, textAlign: 'center' },
  contextHint: { fontFamily: 'Inter', fontSize: 13, color: colors.outline, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
  flipHint: { alignItems: 'center', marginTop: 32, gap: 8 },
  flipHintText: { fontFamily: 'Inter-Medium', fontSize: 11, color: colors.outline, letterSpacing: 1.5 },
  srRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingBottom: 40 },
  srBtn: { flex: 1, alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  srLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, letterSpacing: -0.3 },
  completeContainer: { flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 16 },
  completeTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: colors.onSurface },
  completeScore: { fontFamily: 'Inter', fontSize: 16, color: colors.onSurfaceVariant },
  doneBtn: { backgroundColor: colors.secondary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  doneBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
});
