import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { UserDTO } from '@admin-platform-exam/types';
import { LoginScreen } from './screens/LoginScreen';
import { ContentListScreen } from './screens/ContentListScreen';
import { apiFetch } from './lib/api';
import { getItem } from './lib/storage';

interface MeResponse { user: UserDTO; }

export default function App() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getItem('access_token');
      if (!token) { setLoading(false); return; }
      try {
        const me = await apiFetch<MeResponse>('/auth/me');
        setUser(me.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {user
        ? <ContentListScreen user={user} onLogout={() => setUser(null)} />
        : <LoginScreen onLoggedIn={setUser} />}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
});
