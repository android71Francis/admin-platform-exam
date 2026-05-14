import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import type { UserDTO } from '@admin-platform-exam/types';
import { apiFetch } from '../lib/api';
import { setItem } from '../lib/storage';

interface LoginResponse {
  user: UserDTO;
  accessToken: string;
}

interface Props {
  onLoggedIn: (user: UserDTO) => void;
}

export const LoginScreen = ({ onLoggedIn }: Props) => {
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await setItem('access_token', res.accessToken);
      await setItem('user_id', res.user.id);
      onLoggedIn(res.user);
    } catch (err) {
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign in</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#1f2937' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
