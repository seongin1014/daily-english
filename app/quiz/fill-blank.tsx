import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/src/theme/colors';
import { useExpressions, invalidateDB } from '@/src/db/hooks';
import { saveQuizResult } from '@/src/db/quizzes';
import { ProgressBar } from '@/src/components/ui/ProgressBar';

function generateFillBlank(english: string): { sentence: string; answer: string } | null {
  const words = english.split(/\s+/);
  if (words.length < 3) return null;
  // Pick a word that's at least 3 chars (skip articles, prepositions)
  const candidates = words.filter(w => w.length >= 3);
  if (candidates.length === 0) return null;
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const sentence = english.replace(target, '___');
  return { sentence, answer: target.toLowerCase().replace(/[.,!?]/g, '') };
}

export default function FillBlankQuiz() {
  const router = useRouter();
  const { data: allExpressions } = useExpressions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  const questions = useMemo(() => {
    return allExpressions
      .map(expr => {
        const fb = generateFillBlank(expr.english);
        if (!fb) return null;
        return { expression: expr, ...fb };
      })
      .filter(Boolean)
      .slice(0, 10) as { expression: typeof allExpressions[0]; sentence: string; answer: string }[];
  }, [allExpressions]);

  const question = questions[currentIndex];
  const total = questions.length;
  const isComplete = currentIndex >= total;

  const handleSubmit = () => {
    if (!question || answered) return;
    const correct = userInput.trim().toLowerCase() === question.answer;
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) {
      setScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 >= total) {
      await saveQuizResult('fill_blank', total, score, questions.map(q => q.expression.id));
      invalidateDB();
    }
    setCurrentIndex(i => i + 1);
    setUserInput('');
    setAnswered(false);
    setIsCorrect(false);
  };

  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="edit" size={64} color={colors.outlineVariant} />
        <Text style={styles.emptyText}>표현이 부족합니다</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>돌아가기</Text>
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
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showSentence = answered
    ? question.expression.english
    : question.sentence;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily English</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>DAILY QUIZ {String(currentIndex + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}</Text>
        <Text style={styles.progressPct}>{Math.round(((currentIndex + 1) / total) * 100)}% COMPLETE</Text>
      </View>
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <ProgressBar progress={(currentIndex + 1) / total} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.qAccent} />
          <View style={styles.qContent}>
            <Text style={styles.sentenceText}>
              "{showSentence}"
            </Text>
            <Text style={styles.hintText}>(힌트: {question.expression.korean})</Text>
          </View>
        </View>

        {/* Input */}
        <TextInput
          style={[styles.input, answered && isCorrect && styles.inputCorrect, answered && !isCorrect && styles.inputWrong]}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Type your answer..."
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!answered}
          onSubmitEditing={handleSubmit}
        />

        {answered && !isCorrect && (
          <Text style={styles.correctAnswer}>
            <MaterialIcons name="info" size={14} color={colors.secondary} /> Correct answer: {question.answer}
          </Text>
        )}

        {!answered ? (
          <TouchableOpacity
            style={[styles.submitBtn, !userInput.trim() && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!userInput.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>확인하기 (Submit)</Text>
            <MaterialIcons name="check" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  headerTitle: { fontFamily: 'Manrope-Bold', fontSize: 20, color: '#1a237e' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 8 },
  progressLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.5 },
  progressPct: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.secondary, letterSpacing: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  questionCard: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#1a1c1c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  qAccent: { width: 4, backgroundColor: colors.primaryContainer },
  qContent: { flex: 1, padding: 24 },
  sentenceText: { fontFamily: 'Manrope-Bold', fontSize: 22, color: colors.onSurface, lineHeight: 32 },
  hintText: { fontFamily: 'Inter', fontSize: 14, color: colors.onSurfaceVariant, marginTop: 12 },
  input: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 18, fontFamily: 'Inter', fontSize: 18, color: colors.onSurface, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  inputCorrect: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  inputWrong: { borderColor: colors.error, backgroundColor: '#fef2f2' },
  correctAnswer: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.secondary, marginBottom: 16, paddingLeft: 4 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.secondary, paddingVertical: 18, borderRadius: 12, marginTop: 16 },
  submitBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  emptyContainer: { flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontFamily: 'Inter', fontSize: 16, color: colors.onSurfaceVariant },
  completeTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: colors.onSurface },
  completeScore: { fontFamily: 'Inter', fontSize: 18, color: colors.onSurfaceVariant },
  doneBtn: { backgroundColor: colors.secondary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  doneBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
});
