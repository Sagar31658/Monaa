import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import VoiceConfirmModal from '../components/VoiceTransactionPreview';
import { useRouter } from 'expo-router';

export default function AddVoiceScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const router = useRouter();

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Microphone access is needed');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    setLoading(true);
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const fileInfo = await FileSystem.getInfoAsync(uri!);
      const file = {
        uri,
        name: 'voice.m4a',
        type: 'audio/m4a',
      };

      const formData = new FormData();
      formData.append('audio', file as any);

      const res = await fetchWithAuth(`${Backend}/transactions`, {
        method: 'POST',
        body: formData,
      });
      if (!res) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error parsing voice');

      setParsedData({
        amount: data.data.amount,
        category: data.data.category,
        description: data.data.description,
        type: data.data.type,
        date: new Date(),
      });
    } catch (err) {
      Alert.alert('Error', 'Could not process audio');
    } finally {
      setRecording(null);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#333" />
      </TouchableOpacity>
      <Text style={styles.title}>Voice Transaction</Text>

      {loading && <ActivityIndicator size="large" color="#50c878" />}
      {!recording && !loading && (
        <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
          <Text style={styles.recordText}>🎤 Tap to Record</Text>
        </TouchableOpacity>
      )}
      {recording && (
        <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
          <Text style={styles.stopText}>⏹️ Stop</Text>
        </TouchableOpacity>
      )}

      <VoiceConfirmModal
        visible={!!parsedData}
        data={parsedData}
        onClose={() => setParsedData(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  recordBtn: {
    backgroundColor: '#50c878', padding: 16, borderRadius: 12,
  },
  recordText: { color: 'white', fontSize: 16 },
  stopBtn: {
    backgroundColor: '#ff4444', padding: 16, borderRadius: 12,
  },
  stopText: { color: 'white', fontSize: 16 },
});
