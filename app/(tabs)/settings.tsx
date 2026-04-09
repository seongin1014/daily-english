import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '@/src/stores/useAppStore';
import { useTheme, useThemeMode } from '@/src/theme';
import { Card } from '@/src/components/ui/Card';
import { signOut, updateDisplayName, auth } from '@/src/services/firebase';
import { deleteAllData } from '@/src/db/recordings';
import { invalidateDB, useSetting } from '@/src/db/hooks';
import { setSetting } from '@/src/db/settings';
import { deleteUser } from 'firebase/auth';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeMode();
  const { user, subscription, monthlyUsage, monthlyLimit } = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const { data: savedGoal } = useSetting('daily_goal', '10');
  const [dailyGoal, setDailyGoal] = useState(10);

  useEffect(() => {
    setDailyGoal(Number(savedGoal));
  }, [savedGoal]);

  const updateDailyGoal = (newGoal: number) => {
    setDailyGoal(newGoal);
    setSetting('daily_goal', String(newGoal));
    invalidateDB();
  };

  const styles = useMemo(() => createStyles(colors), [colors]);
  const remaining = Math.max(0, monthlyLimit - monthlyUsage);

  const handleEditName = () => {
    Alert.prompt(
      '이름 변경',
      '표시할 이름을 입력하세요',
      async (name) => {
        if (name?.trim()) {
          await updateDisplayName(name.trim());
          useAppStore.getState().setUser({ ...user, displayName: name.trim() } as any);
        }
      },
      'plain-text',
      user?.displayName || ''
    );
  };

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAll = () => {
    Alert.alert('데이터 삭제', '모든 녹음, 표현, 학습 기록이 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        Alert.alert('정말 삭제하시겠습니까?', '이 작업은 되돌릴 수 없습니다.', [
          { text: '취소', style: 'cancel' },
          { text: '영구 삭제', style: 'destructive', onPress: async () => {
            await deleteAllData();
            invalidateDB();
            Alert.alert('삭제 완료', '모든 데이터가 삭제되었습니다.');
          }},
        ]);
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('회원 탈퇴', '계정과 모든 데이터가 영구적으로 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      { text: '탈퇴하기', style: 'destructive', onPress: async () => {
        try {
          await deleteAllData();
          invalidateDB();
          const currentUser = auth.currentUser;
          if (currentUser) {
            await deleteUser(currentUser);
          }
        } catch (e: any) {
          if (e.code === 'auth/requires-recent-login') {
            Alert.alert('재인증 필요', '보안을 위해 로그아웃 후 다시 로그인한 뒤 탈퇴해주세요.');
          } else {
            Alert.alert('탈퇴 실패', '다시 시도해주세요.');
          }
        }
      }},
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
        </View>

        {/* ─── 프로필 + 구독 카드 ─── */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={32} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={handleEditName}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.profileName}>{user?.displayName || user?.email?.split('@')[0] || '사용자'}</Text>
                  <MaterialIcons name="edit" size={14} color="rgba(255,255,255,0.6)" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>
            {subscription === 'pro' ? (
              <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
            ) : (
              <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
            )}
          </View>
          <View style={styles.profileDivider} />
          <View style={styles.subRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>
                {subscription === 'pro' ? 'Pro — 무제한 녹음' : `무료 플랜 · 이번 달 ${remaining}회 남음`}
              </Text>
            </View>
            {subscription !== 'pro' && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => router.push('/auth/paywall')}
              >
                <Text style={styles.upgradeBtnText}>업그레이드</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ─── 기타 설정 ─── */}
        <Text style={styles.sectionTitle}>기타 설정</Text>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialIcons name="notifications-none" size={20} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>알림</Text>
              <Text style={styles.settingDesc}>학습 리마인더</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={(v) => {
                if (v) {
                  setNotifications(true);
                } else {
                  setNotifications(false);
                }
                Alert.alert('준비 중', '알림 기능은 곧 이용 가능합니다!');
              }}
              trackColor={{ false: colors.surfaceDim, true: colors.primaryFixed }}
              thumbColor={notifications ? colors.primary : colors.outline}
            />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialIcons name={themeMode === 'dark' ? 'dark-mode' : 'light-mode'} size={20} color={colors.tertiary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>테마</Text>
              <Text style={styles.settingDesc}>{themeMode === 'dark' ? '다크 모드' : '라이트 모드'}</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
              trackColor={{ false: colors.surfaceDim, true: colors.primaryFixed }}
              thumbColor={themeMode === 'dark' ? colors.primary : colors.outline}
            />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialIcons name="flag" size={20} color={colors.onSurface} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>일일 목표</Text>
              <Text style={styles.settingDesc}>하루 목표 카드 수</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDailyGoal(Math.max(1, dailyGoal - 5))}>
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{dailyGoal}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateDailyGoal(dailyGoal + 5)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* ─── 더보기 ─── */}
        <Text style={styles.sectionTitle}>더보기</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('개인정보처리방침', '준비 중입니다.')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="policy" size={20} color={colors.onSurface} />
          <Text style={[styles.settingLabel, { flex: 1 }]}>개인정보처리방침</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('이용약관', '준비 중입니다.')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="description" size={20} color={colors.onSurface} />
          <Text style={[styles.settingLabel, { flex: 1 }]}>이용약관</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAll} activeOpacity={0.7}>
          <MaterialIcons name="delete-outline" size={20} color={colors.onSurface} />
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>모든 데이터 삭제</Text>
            <Text style={styles.settingDesc}>녹음, 표현, 학습 기록 영구 삭제</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <View style={styles.smallActions}>
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={styles.smallActionText}>로그아웃</Text>
          </TouchableOpacity>
          <Text style={styles.smallDivider}>|</Text>
          <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Text style={[styles.smallActionText, { color: colors.error }]}>회원탈퇴</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>ECHOLING VERSION 1.1.0</Text>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Pretendard-Bold', fontSize: 20, color: colors.onSurface },
  profileCard: { backgroundColor: colors.primaryContainer, borderRadius: 16, padding: 20, marginBottom: 28 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  subLabel: { fontFamily: 'Pretendard-Medium', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontFamily: 'Pretendard-Bold', fontSize: 18, color: '#fff' },
  profileEmail: { fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  proBadge: { backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  proBadgeText: { fontFamily: 'Pretendard-Bold', fontSize: 11, color: '#fff', letterSpacing: 1 },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  freeBadgeText: { fontFamily: 'Pretendard-Bold', fontSize: 11, color: '#fff', letterSpacing: 1 },
  sectionTitle: { fontFamily: 'Pretendard-Bold', fontSize: 15, color: colors.onSurface, marginBottom: 12, marginTop: 8 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgradeBtn: { backgroundColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  upgradeBtnText: { fontFamily: 'Pretendard-Bold', fontSize: 13, color: '#fff' },
  settingCard: { marginBottom: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingLabel: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: colors.onSurface },
  settingDesc: { fontFamily: 'Pretendard', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginBottom: 10 },
  smallActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 4, marginBottom: 20 },
  smallActionText: { fontFamily: 'Pretendard-Medium', fontSize: 13, color: colors.onSurfaceVariant },
  smallDivider: { fontFamily: 'Pretendard', fontSize: 13, color: colors.outline },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: 'Pretendard-Bold', fontSize: 18, color: colors.onSurface },
  stepperValue: { fontFamily: 'Pretendard-Bold', fontSize: 18, color: colors.onSurface, minWidth: 30, textAlign: 'center' },
  version: { fontFamily: 'Pretendard-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', letterSpacing: 2, marginTop: 28 },
});
