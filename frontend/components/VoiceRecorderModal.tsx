import React, { useState, useEffect } from 'react';
import { Alert, Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import VoiceConfirmModal from './VoiceTransactionPreview';
import * as FileSystem from 'expo-file-system';

export default function VoiceRecorderModal({ visible, onClose, onTransactionAdded }: { visible: boolean; onClose: () => void; onTransactionAdded?: () => void; }) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Microphone access is needed');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingStart(Date.now());
    } catch (err) {
      console.error('Error starting recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      const durationMs = Date.now() - (recordingStart || 0);
      if (durationMs < 1000) {
        Alert.alert('Recording too short', 'Please speak for at least 1 second.');
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri!);
      if (!fileInfo.exists || fileInfo.size < 1024) {
        Alert.alert('Empty recording', 'Please try again.');
        return;
      }

      sendToAPI(uri!);
    } catch (err) {
      console.error('Error stopping recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      setRecording(null);
      setIsRecording(false);
    }
  };

  const sendToAPI = async (uri: string) => {
    setLoading(true);
    const file = {
      uri,
      name: 'voice.m4a',
      type: 'audio/m4a',
    };

    const form = new FormData();
    form.append('audio', file as any);

    try {
      const res = await fetchWithAuth(`${Backend}/transactions`, {
        method: 'POST',
        body: form,
      });
      if (!res) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error parsing voice');
      console.log(data)
      setParsedData({
        amount: data.data.amount,
        category: data.data.category,
        description: data.data.description,
        type: data.data.type,
        date: new Date(),
      });
    } catch (e) {
      console.error('Voice prediction failed:', e);
      Alert.alert('Error', 'Could not process audio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      setParsedData(null);
      setIsRecording(false);
      setRecording(null);
      setLoading(false);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {loading ? (
            <ActivityIndicator size="large" color="#007aff" />
          ) : parsedData ? (
            <VoiceConfirmModal visible={true} data={parsedData} onClose={onClose} onConfirmed={onTransactionAdded} />
          ) : (
            <>
              <Text style={styles.title}>
                {isRecording ? 'Recording...' : 'Tap the mic to record'}
              </Text>
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.recording]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  micButton: {
    backgroundColor: '#007aff',
    padding: 20,
    borderRadius: 50,
    marginBottom: 15,
  },
  recording: {
    backgroundColor: '#ff3b30',
  },
  cancel: {
    color: '#555',
    marginTop: 10,
  },
});
