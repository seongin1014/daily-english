import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { useRecordings } from '@/src/db/hooks';
import { Badge } from '@/src/components/ui/Badge';
import type { Recording } from '@/src/types/recording';

export default function RecordingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: recordings } = useRecordings();
  const [search, setSearch] = useState('');

  const styles = useMemo(() => createStyles(colors), [colors]);

  const filtered = search
    ? recordings.filter(r => r.title?.toLowerCase().includes(search.toLowerCase()))
    : recordings;

  const renderItem = ({ item }: { item: Recording }) => {
    const date = new Date(item.created_at);
    const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '');
    const statusVariant = item.status === 'ready' ? 'ready' : item.status === 'error' ? 'error' : 'processing';

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push(`/recording/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemDate}>{dateStr}</Text>
          <Badge variant={statusVariant} />
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.metaText}>⏱ {item.duration ? `${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, '0')}` : '--'}</Text>
          <Text style={styles.metaText}>文A  -- expressions</Text>
        </View>
        {item.status !== 'ready' && item.status !== 'error' ? (
          <MaterialIcons name="lock" size={20} color={colors.outline} />
        ) : (
          <TouchableOpacity style={styles.chevron}>
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>나의 녹음 목록</Text>
        <TouchableOpacity>
          <MaterialIcons name="more-vert" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color={colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="녹음 파일 검색"
          placeholderTextColor={colors.outline}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
        <Text style={styles.sortLabel}>최신순 ▾</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="mic-off" size={48} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>녹음이 없습니다</Text>
          </View>
        }
        ListFooterComponent={
          recordings.length > 0 ? (
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>INSIGHT</Text>
              <Text style={styles.insightTitle}>주간 학습 리포트가 도착했습니다</Text>
              <Text style={styles.insightDesc}>지난 7일간의 녹음 데이터를 분석하여 가장 자주 사용한 패턴을 정리했어요.</Text>
              <TouchableOpacity style={styles.insightBtn}>
                <Text style={styles.insightBtnText}>리포트 보기</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/record')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  title: { fontFamily: 'Manrope-Bold', fontSize: 18, color: colors.onSurface },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 },
  searchInput: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.onSurface },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase' },
  sortLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.onSurface },
  item: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemDate: { fontFamily: 'Manrope-Bold', fontSize: 15, color: colors.onSurface },
  itemMeta: { flexDirection: 'row', gap: 12, marginRight: 12 },
  metaText: { fontFamily: 'Inter', fontSize: 12, color: colors.onSurfaceVariant },
  chevron: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: colors.onSurfaceVariant, marginTop: 12 },
  insightCard: { backgroundColor: colors.primaryContainer, borderRadius: 20, padding: 24, marginTop: 20 },
  insightLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  insightTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 22, color: '#fff', lineHeight: 30, marginBottom: 8 },
  insightDesc: { fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 16 },
  insightBtn: { backgroundColor: colors.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' },
  insightBtnText: { fontFamily: 'Manrope-Bold', fontSize: 13, color: '#fff' },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(172,53,9,0.4)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8 },
});
