import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

type TabIconName = 'home' | 'mic' | 'menu-book' | 'settings';

const tabs: { name: string; title: string; icon: TabIconName; label: string }[] = [
  { name: 'index', title: 'Home', icon: 'home', label: 'HOME' },
  { name: 'recordings', title: 'Recordings', icon: 'mic', label: 'RECORDINGS' },
  { name: 'study', title: 'Study', icon: 'menu-book', label: 'STUDY' },
  { name: 'settings', title: 'Settings', icon: 'settings', label: 'SETTINGS' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <BlurView intensity={70} tint="light" style={styles.tabBarBlur}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const tab = tabs.find(t => t.name === route.name);
          if (!tab) return null;
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <MaterialIcons
                name={tab.icon}
                size={24}
                color={isFocused ? '#ffffff' : '#94a3b8'}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
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
    shadowColor: '#1a1c1c',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: 'rgba(249,249,249,0.7)',
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#1a237e',
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 4,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
});
