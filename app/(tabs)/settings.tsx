import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useAppStore } from '@/src/stores/useAppStore';
import { useThemeMode } from '@/src/theme';
import { Card } from '@/src/components/ui/Card';
import { signOut } from '@/src/services/firebase';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeMode();
  const { user, subscription, monthlyUsage, monthlyLimit } = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(10);

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAll = () => {
    Alert.alert('데이터 삭제', '모든 녹음, 표현, 학습 기록이 삭제됩니다. 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {} },
    ]);
  };

  const remaining = Math.max(0, monthlyLimit - monthlyUsage);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.displayName || '사용자'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
          {subscription === 'pro' ? (
            <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
          ) : (
            <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
          )}
        </View>

        {/* Subscription */}
        <Text style={styles.sectionTitle}>구독 관리</Text>
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.subRow}>
            <View>
              <Text style={styles.settingLabel}>현재 플랜</Text>
              <Text style={styles.settingDesc}>
                {subscription === 'pro' ? 'Pro — 무제한 녹음' : `무료 — 이번 달 ${remaining}회 남음`}
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
        </Card>

        {/* Study Goal */}
        <Text style={styles.sectionTitle}>학습 목표</Text>
        <Card style={styles.goalCard}>
          <View style={styles.goalRow}>
            <View style={styles.goalLeft}>
              <MaterialIcons name="flag" size={20} color={colors.onSurface} />
              <View>
                <Text style={styles.settingLabel}>일일 목표</Text>
                <Text style={styles.settingDesc}>하루 목표 카드 수</Text>
              </View>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setDailyGoal(Math.max(1, dailyGoal - 5))}>
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{dailyGoal}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setDailyGoal(dailyGoal + 5)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>알림 설정</Text>
        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialIcons name="notifications" size={20} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>알림</Text>
              <Text style={styles.settingDesc}>학습 리마인더 활성화</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.surfaceDim, true: colors.primaryFixed }}
              thumbColor={notifications ? colors.primary : colors.outline}
            />
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialIcons name="dark-mode" size={20} color={colors.tertiary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>다크 모드</Text>
              <Text style={styles.settingDesc}>앱 테마 변경</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
              trackColor={{ false: colors.surfaceDim, true: colors.primaryFixed }}
              thumbColor={themeMode === 'dark' ? colors.primary : colors.outline}
            />
          </View>
        </Card>

        {/* Account Actions */}
        <Text style={styles.sectionTitle}>계정</Text>

        <TouchableOpacity style={styles.dataItem} onPress={handleSignOut} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={20} color={colors.onSurface} />
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>로그아웃</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dataItemDanger} onPress={handleDeleteAll} activeOpacity={0.7}>
          <MaterialIcons name="delete-forever" size={20} color={colors.error} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.error }]}>모든 데이터 삭제</Text>
            <Text style={styles.settingDesc}>녹음, 표현, 학습 기록 영구 삭제</Text>
          </View>
          <MaterialIcons name="warning" size={20} color={colors.error} />
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>ECHOLING VERSION 1.1.0</Text>
        <Text style={styles.versionSub}>ACADEMIC ATELIER DESIGN SYSTEM</Text>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Pretendard-Bold', fontSize: 20, color: colors.onSurface },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.primaryContainer, borderRadius: 16, padding: 20, marginBottom: 28 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontFamily: 'Pretendard-Bold', fontSize: 18, color: '#fff' },
  profileEmail: { fontFamily: 'Pretendard', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  proBadge: { backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  proBadgeText: { fontFamily: 'Pretendard-Bold', fontSize: 11, color: '#fff', letterSpacing: 1 },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  freeBadgeText: { fontFamily: 'Pretendard-Bold', fontSize: 11, color: '#fff', letterSpacing: 1 },
  sectionTitle: { fontFamily: 'Pretendard-Bold', fontSize: 15, color: colors.onSurface, marginBottom: 12 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgradeBtn: { backgroundColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  upgradeBtnText: { fontFamily: 'Pretendard-Bold', fontSize: 13, color: '#fff' },
  goalCard: { marginBottom: 28 },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingCard: { marginBottom: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingLabel: { fontFamily: 'Pretendard-Medium', fontSize: 14, color: colors.onSurface },
  settingDesc: { fontFamily: 'Pretendard', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: 'Pretendard-Bold', fontSize: 18, color: colors.onSurface },
  stepperValue: { fontFamily: 'Pretendard-Bold', fontSize: 18, color: colors.onSurface, minWidth: 30, textAlign: 'center' },
  dataItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginBottom: 10 },
  dataItemDanger: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginBottom: 28 },
  version: { fontFamily: 'Pretendard-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', letterSpacing: 2 },
  versionSub: { fontFamily: 'Pretendard', fontSize: 10, color: colors.outline, textAlign: 'center', letterSpacing: 1, marginTop: 4 },
});
