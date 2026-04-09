import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { useExpressions, invalidateDB } from '@/src/db/hooks';
import { saveQuizResult } from '@/src/db/quizzes';
import { ProgressBar } from '@/src/components/ui/ProgressBar';

export default function MultipleChoiceQuiz() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: allExpressions } = useExpressions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const questions = useMemo(() => {
    if (allExpressions.length < 4) return [];
    const shuffled = [...allExpressions].sort(() => Math.random() - 0.5).slice(0, 10);
    return shuffled.map((expr) => {
      const others = allExpressions.filter(e => e.id !== expr.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...others.map(o => o.english), expr.english].sort(() => Math.random() - 0.5);
      return { expression: expr, options, correctIndex: options.indexOf(expr.english) };
    });
  }, [allExpressions]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const question = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;
  const total = questions.length;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === question.correctIndex) {
      setScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 >= questions.length) {
      await saveQuizResult('multiple_choice', total, score + (selected === question?.correctIndex ? 0 : 0), questions.map(q => q.expression.id));
      invalidateDB();
    }
    setCurrentIndex(i => i + 1);
    setSelected(null);
    setAnswered(false);
  };

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="quiz" size={64} color={colors.outlineVariant} />
        <Text style={styles.emptyText}>표현이 4개 이상 필요합니다</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="emoji-events" size={64} color={colors.secondary} />
        <Text style={styles.completeTitle}>Quiz Complete!</Text>
        <Text style={styles.completeScore}>Score: {score} / {total}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EchoLing</Text>
        <View style={styles.scoreBox}>
          <MaterialIcons name="local-fire-department" size={18} color={colors.secondary} />
          <Text style={styles.scoreText}>{score * 100}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>CURRENT SESSION</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressQuestion}>Question {currentIndex + 1} of {total}</Text>
          <Text style={styles.progressScore}>SCORE</Text>
        </View>
        <ProgressBar progress={(currentIndex + 1) / total} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.qAccent} />
          <View style={styles.qContent}>
            <Text style={styles.qLabel}>TRANSLATE THIS PHRASE</Text>
            <Text style={styles.qKorean}>"{question.expression.korean}"의 가장 자연스러운 영어 표현은?</Text>
            <View style={styles.hintBox}>
              <MaterialIcons name="info" size={14} color={colors.primary} />
              <Text style={styles.hintText}>Hint: {question.expression.context_english?.slice(0, 60) || 'Used in everyday conversation'}</Text>
            </View>
          </View>
        </View>

        {/* Options */}
        {question.options.map((opt, idx) => {
          const isCorrect = idx === question.correctIndex;
          const isSelected = selected === idx;
          let borderColor = 'transparent';
          if (answered && isCorrect) borderColor = colors.success;
          if (answered && isSelected && !isCorrect) borderColor = colors.error;

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.option, answered && isCorrect && styles.optionCorrect, answered && isSelected && !isCorrect && styles.optionWrong]}
              onPress={() => handleSelect(idx)}
              activeOpacity={0.7}
              disabled={answered}
            >
              <View style={[styles.optionLetter, answered && isCorrect && { backgroundColor: colors.success }]}>
                <Text style={[styles.optionLetterText, answered && isCorrect && { color: '#fff' }]}>{letters[idx]}</Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
              {answered && isCorrect && <MaterialIcons name="check-circle" size={22} color={colors.success} style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
          );
        })}

        {/* Feedback */}
        {answered && (
          <View style={[styles.feedback, selected === question.correctIndex ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <MaterialIcons name={selected === question.correctIndex ? 'auto-awesome' : 'info'} size={24} color={selected === question.correctIndex ? colors.success : colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.feedbackTitle}>{selected === question.correctIndex ? 'Well done!' : 'Not quite'}</Text>
              <Text style={styles.feedbackDesc}>{question.expression.context_english || question.expression.english}</Text>
            </View>
          </View>
        )}

        {answered && (
          <TouchableOpacity style={styles.continueBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.continueBtnText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  headerTitle: { fontFamily: 'Manrope-Bold', fontSize: 20, color: colors.primaryContainer },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: colors.onSurface },
  progressSection: { paddingHorizontal: 24, marginBottom: 20 },
  progressLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressQuestion: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface },
  progressScore: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.secondary, letterSpacing: 1 },
  scroll: { paddingHorizontal: 24 },
  questionCard: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#1a1c1c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  qAccent: { width: 4, backgroundColor: colors.primaryContainer },
  qContent: { flex: 1, padding: 20 },
  qLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.secondary, letterSpacing: 2, marginBottom: 12 },
  qKorean: { fontFamily: 'Manrope-Bold', fontSize: 20, color: colors.onSurface, lineHeight: 28, marginBottom: 16 },
  hintBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 8 },
  hintText: { fontFamily: 'Inter', fontSize: 13, color: colors.onSurfaceVariant, flex: 1, lineHeight: 20 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.successContainer },
  optionWrong: { borderColor: colors.error, backgroundColor: colors.errorContainer },
  optionLetter: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontFamily: 'Manrope-Bold', fontSize: 14, color: colors.onSurface },
  optionText: { fontFamily: 'Inter-Medium', fontSize: 15, color: colors.onSurface, flex: 1 },
  feedback: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 12, marginTop: 8, marginBottom: 16, alignItems: 'flex-start' },
  feedbackCorrect: { backgroundColor: colors.successContainer, borderWidth: 1, borderColor: colors.success },
  feedbackWrong: { backgroundColor: colors.errorContainer, borderWidth: 1, borderColor: colors.error },
  feedbackTitle: { fontFamily: 'Manrope-Bold', fontSize: 16, color: colors.onSurface, marginBottom: 4 },
  feedbackDesc: { fontFamily: 'Inter', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.secondary, paddingVertical: 16, borderRadius: 12 },
  continueBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  emptyContainer: { flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontFamily: 'Inter', fontSize: 16, color: colors.onSurfaceVariant },
  completeTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: colors.onSurface },
  completeScore: { fontFamily: 'Inter', fontSize: 18, color: colors.onSurfaceVariant },
  backBtn: { backgroundColor: colors.secondary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  backBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
});
