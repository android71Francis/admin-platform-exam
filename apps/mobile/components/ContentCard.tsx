import { View, Text, StyleSheet } from 'react-native';
import type { ContentDTO } from '@admin-platform-exam/types';

export const ContentCard = ({ item }: { item: ContentDTO }) => (
  <View style={styles.card}>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
    <View style={styles.footer}>
      <View style={[styles.badge, item.status === 'PUBLISHED' ? styles.badgePublished : styles.badgeDraft]}>
        <Text style={[styles.badgeText, item.status === 'PUBLISHED' ? styles.badgePublishedText : styles.badgeDraftText]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.date}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 6 },
  body: { fontSize: 14, color: '#4b5563', marginBottom: 12, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  badgePublished: { backgroundColor: '#d1fae5' },
  badgePublishedText: { color: '#065f46' },
  badgeDraft: { backgroundColor: '#fef3c7' },
  badgeDraftText: { color: '#92400e' },
  date: { fontSize: 12, color: '#6b7280' },
});
