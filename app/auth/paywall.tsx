import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { getOfferings, purchasePackage, restorePurchases } from '@/src/services/subscription';
import { useAppStore } from '@/src/stores/useAppStore';
import type { PurchasesPackage } from 'react-native-purchases';

export default function PaywallScreen() {
  const router = useRouter();
  const setSubscription = useAppStore(s => s.setSubscription);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    const pkgs = await getOfferings();
    setPackages(pkgs);
  };

  const handlePurchase = async () => {
    if (packages.length === 0) return;
    setLoading(true);
    try {
      const success = await purchasePackage(packages[selectedIndex]);
      if (success) {
        setSubscription('pro');
        Alert.alert('구독 완료!', 'Pro 플랜이 활성화되었습니다. 무제한으로 녹음하세요!');
        router.back();
      }
    } catch (e: any) {
      Alert.alert('구매 실패', e.message ?? '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      if (result === 'pro') {
        setSubscription('pro');
        Alert.alert('복원 완료!', 'Pro 구독이 복원되었습니다.');
        router.back();
      } else {
        Alert.alert('복원 결과', '활성 구독을 찾을 수 없습니다.');
      }
    } catch {
      Alert.alert('복원 실패', '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <MaterialIcons name="close" size={24} color={colors.onSurface} />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <MaterialIcons name="workspace-premium" size={56} color={colors.secondary} />
        <Text style={styles.title}>월 녹음 횟수를 모두 사용했어요</Text>
        <Text style={styles.subtitle}>Pro로 업그레이드하고 무제한으로 녹음하세요</Text>

        {/* Benefits */}
        <View style={styles.benefits}>
          {['무제한 녹음 및 영어 변환', '우선 처리 (빠른 변환 속도)', '향후 AI 기반 표현 추출'].map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <MaterialIcons name="check-circle" size={20} color={colors.secondary} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Price Options */}
        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.option, selectedIndex === 0 && styles.optionSelected]}
            onPress={() => setSelectedIndex(0)}
          >
            <Text style={styles.optionTitle}>월간</Text>
            <Text style={styles.optionPrice}>₩4,900/월</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, selectedIndex === 1 && styles.optionSelected]}
            onPress={() => setSelectedIndex(1)}
          >
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>33% 할인</Text>
            </View>
            <Text style={styles.optionTitle}>연간</Text>
            <Text style={styles.optionPrice}>₩39,000/년</Text>
            <Text style={styles.optionSub}>월 ₩3,250</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.purchaseBtn}
          onPress={handlePurchase}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseBtnText}>Pro 시작하기</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={loading}>
          <Text style={styles.restoreText}>구매 복원</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  closeBtn: { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 8 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  title: { fontFamily: 'Pretendard-ExtraBold', fontSize: 24, color: colors.onSurface, textAlign: 'center', marginTop: 20, lineHeight: 34 },
  subtitle: { fontFamily: 'Pretendard', fontSize: 15, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 },
  benefits: { marginTop: 32, alignSelf: 'stretch', gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontFamily: 'Pretendard-Medium', fontSize: 15, color: colors.onSurface },
  options: { flexDirection: 'row', gap: 12, marginTop: 32, alignSelf: 'stretch' },
  option: { flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: colors.secondary },
  optionTitle: { fontFamily: 'Pretendard-SemiBold', fontSize: 13, color: colors.onSurfaceVariant },
  optionPrice: { fontFamily: 'Pretendard-ExtraBold', fontSize: 22, color: colors.onSurface, marginTop: 4 },
  optionSub: { fontFamily: 'Pretendard', fontSize: 12, color: colors.outline, marginTop: 2 },
  discountBadge: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  discountText: { fontFamily: 'Pretendard-SemiBold', fontSize: 10, color: '#fff' },
  purchaseBtn: { backgroundColor: colors.secondary, paddingVertical: 18, borderRadius: 12, alignSelf: 'stretch', alignItems: 'center', marginTop: 24 },
  purchaseBtnText: { fontFamily: 'Pretendard-Bold', fontSize: 17, color: '#fff' },
  restoreText: { fontFamily: 'Pretendard-Medium', fontSize: 13, color: colors.outline, marginTop: 16 },
});
