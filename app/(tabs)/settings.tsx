import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors } from '@/src/theme/colors';
import { useAppStore } from '@/src/stores/useAppStore';
import { useThemeMode } from '@/src/theme';
import { Card } from '@/src/components/ui/Card';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode } = useThemeMode();
  const { setApiKeyConfigured } = useAppStore();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(10);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    const key = await SecureStore.getItemAsync('google_cloud_api_key');
    if (key) setApiKey(key);
  };

  const saveApiKey = async (key: string) => {
    setApiKey(key);
    if (key.trim()) {
      await SecureStore.setItemAsync('google_cloud_api_key', key.trim());
      setApiKeyConfigured(true);
    } else {
      await SecureStore.deleteItemAsync('google_cloud_api_key');
      setApiKeyConfigured(false);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently erase all recordings, expressions, and study progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { /* TODO: implement */ } },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>설정</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity><MaterialIcons name="search" size={22} color={colors.onSurface} /></TouchableOpacity>
            <TouchableOpacity><MaterialIcons name="more-vert" size={22} color={colors.onSurface} /></TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color="#fff" />
          </View>
          <View>
            <Text style={styles.profileName}>Daily English User</Text>
            <Text style={styles.profileTier}>FREE TIER ACADEMIC</Text>
          </View>
        </View>

        {/* Study Goal */}
        <Text style={styles.sectionTitle}>학습 목표</Text>
        <Card style={styles.goalCard}>
          <View style={styles.goalRow}>
            <View style={styles.goalLeft}>
              <MaterialIcons name="flag" size={20} color={colors.onSurface} />
              <View>
                <Text style={styles.goalLabel}>Daily goal</Text>
                <Text style={styles.goalDesc}>Target vocabulary cards per day</Text>
              </View>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDailyGoal(Math.max(1, dailyGoal - 5))}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{dailyGoal}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDailyGoal(dailyGoal + 5)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Notification Settings */}
        <Text style={styles.sectionTitle}>알림 설정</Text>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialIcons name="notifications" size={20} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDesc}>Enable study reminders</Text>
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
            <MaterialIcons name="schedule" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Study reminder</Text>
              <Text style={styles.settingDesc}>Daily notification time</Text>
            </View>
            <Text style={styles.timeValue}>8:00 PM</Text>
          </View>
        </Card>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <MaterialIcons name="dark-mode" size={20} color={colors.tertiary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDesc}>Switch app appearance</Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
              trackColor={{ false: colors.surfaceDim, true: colors.primaryFixed }}
              thumbColor={themeMode === 'dark' ? colors.primary : colors.outline}
            />
          </View>
        </Card>

        {/* API Settings */}
        <Text style={styles.sectionTitle}>API 설정</Text>
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.apiRow}>
            <MaterialIcons name="cloud" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Google Cloud Key</Text>
          </View>
          <View style={styles.apiInputRow}>
            <TextInput
              style={styles.apiInput}
              value={apiKey}
              onChangeText={saveApiKey}
              placeholder="Enter your API key"
              placeholderTextColor={colors.outline}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeBtn}>
              <MaterialIcons name={showKey ? 'visibility' : 'visibility-off'} size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.apiHint}>Required for advanced transcription and translation features. Your key is encrypted locally.</Text>
        </Card>

        {/* Data Management */}
        <Text style={styles.sectionTitle}>데이터 관리</Text>

        <TouchableOpacity style={styles.dataItem} activeOpacity={0.7}>
          <MaterialIcons name="ios-share" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Export recordings</Text>
            <Text style={styles.settingDesc}>Save all audio files to cloud or device</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dataItemDanger} onPress={handleDeleteAll} activeOpacity={0.7}>
          <MaterialIcons name="delete-forever" size={20} color={colors.error} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.error }]}>Delete all data</Text>
            <Text style={styles.settingDesc}>Permanently erase history and progress</Text>
          </View>
          <MaterialIcons name="warning" size={20} color={colors.error} />
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>DAILY ENGLISH VERSION 1.0.0</Text>
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
  title: { fontFamily: 'Manrope-Bold', fontSize: 20, color: colors.onSurface },
  headerRight: { flexDirection: 'row', gap: 12 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.primaryContainer, borderRadius: 16, padding: 20, marginBottom: 28 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#fff' },
  profileTier: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginTop: 4 },
  sectionTitle: { fontFamily: 'Manrope-Bold', fontSize: 15, color: colors.onSurface, marginBottom: 12 },
  goalCard: { marginBottom: 28 },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  goalLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.onSurface },
  goalDesc: { fontFamily: 'Inter', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface },
  stepperValue: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface, minWidth: 30, textAlign: 'center' },
  settingCard: { marginBottom: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.onSurface },
  settingDesc: { fontFamily: 'Inter', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  timeValue: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.primary, backgroundColor: colors.primaryFixed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  apiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  apiInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: 8, marginBottom: 8 },
  apiInput: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.onSurface, paddingHorizontal: 16, paddingVertical: 12 },
  eyeBtn: { padding: 12 },
  apiHint: { fontFamily: 'Inter', fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18 },
  dataItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginBottom: 10 },
  dataItemDanger: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 18, marginBottom: 28 },
  version: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', letterSpacing: 2 },
  versionSub: { fontFamily: 'Inter', fontSize: 10, color: colors.outline, textAlign: 'center', letterSpacing: 1, marginTop: 4 },
});
