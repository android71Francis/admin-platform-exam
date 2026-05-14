import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import type { ContentDTO, UserDTO } from '@admin-platform-exam/types';
import { apiFetch } from '../lib/api';
import { deleteItem } from '../lib/storage';
import { ContentCard } from '../components/ContentCard';

interface Props {
  user: UserDTO;
  onLogout: () => void;
}

export const ContentListScreen = ({ user, onLogout }: Props) => {
  const [items, setItems] = useState<ContentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<ContentDTO[]>(`/content/user/${user.id}`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    await deleteItem('access_token');
    await deleteItem('user_id');
    onLogout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retry} onPress={() => { setLoading(true); load(); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Content for {user.name}</Text>
          <Text style={styles.headerSubtitle}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ContentCard item={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No content assigned yet.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logout: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 48 },
  error: { color: '#dc2626', marginBottom: 12, textAlign: 'center', paddingHorizontal: 24 },
  retry: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: 'white', fontWeight: '500' },
});
