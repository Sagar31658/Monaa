import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LogoutButton from '../components/LogoutButton';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetchWithAuth(`${Backend}/auth/me`);
        if (!res) throw new Error("Request failed");
        const data = await res.json();
        setUser(data?.data);
      } catch (err) {
        console.error('Failed to fetch user profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#50c878" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#333" />
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <Image
          source={user?.profilePhoto?.url ? { uri: user.profilePhoto.url } : require('../assets/images/avatar.avif')}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Voice Preference</Text>
        <View style={styles.infoItem}>
          <Ionicons name="mic-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.infoText}>{user?.voicePreference || 'neutral'}</Text>
        </View>
      </View>


      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color="#555" style={styles.icon} />
          <Text style={styles.infoText}>Created At: {new Date(user?.createdAt).toDateString()}</Text>
        </View>
      </View>

      <LogoutButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    top:50,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 10,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  infoSection: {
    marginBottom: 30,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
});
