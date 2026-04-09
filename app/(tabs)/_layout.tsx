import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

type TabIconName = 'home' | 'mic' | 'menu-book' | 'settings';

const tabs: { name: string; title: string; icon: TabIconName; label: string }[] = [
  { name: 'index', title: 'Home', icon: 'home', label: 'HOME' },
  { name: 'recordings', title: 'Recordings', icon: 'mic', label: 'RECORDINGS' },
  { name: 'study', title: 'Study', icon: 'menu-book', label: 'STUDY' },
  { name: 'settings', title: 'Settings', icon: 'settings', label: 'SETTINGS' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0);

  return (
    <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={styles.tabBarBlur}>
      <View style={[styles.tabBar, { paddingBottom: bottomPadding + 8, backgroundColor: isDark ? 'rgba(10,14,30,0.85)' : 'rgba(249,249,249,0.7)' }]}>
        {state.routes.map((route: any, index: number) => {
          const tab = tabs.find(t => t.name === route.name);
          if (!tab) return null;
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
              style={[styles.tab, isFocused && { backgroundColor: colors.primaryContainer }]}
            >
              <MaterialIcons
                name={tab.icon}
                size={24}
                color={isFocused ? '#ffffff' : colors.onSurfaceVariant}
              />
              <Text style={[styles.tabLabel, { color: isFocused ? '#ffffff' : colors.onSurfaceVariant }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="recordings" />
      <Tabs.Screen name="study" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
