import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { TextInput, Button, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { saveAuthToSecureStore } from '../utils/Auth';
import { Backend } from '../constants/backendUri'

export default function RegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [voicePreference, setVoicePreference] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!imageUri) return Alert.alert('Please upload a profile photo');

    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('voice', voicePreference);

    formData.append('profilePhoto', {
      uri: imageUri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const res = await fetch(`${Backend}/auth/register`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      const token = data?.data?.accessToken || '';
      const user = data?.data || {};

      await saveAuthToSecureStore(token, user);
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Registration Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your Monaa account</Text>

      <TextInput label="First Name" value={firstName} onChangeText={setFirstName} style={styles.input} mode="outlined" />
      <TextInput label="Last Name" value={lastName} onChangeText={setLastName} style={styles.input} mode="outlined" />
      <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" mode="outlined" />
      <TextInput label="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry mode="outlined" />

      <Text style={styles.label}>Voice Preference</Text>
      <RadioButton.Group onValueChange={(value) => setVoicePreference(value as any)} value={voicePreference}>
        <View style={styles.radioGroup}>
          <RadioButton.Item label="Male" value="male" />
          <RadioButton.Item label="Female" value="female" />
          <RadioButton.Item label="Neutral" value="neutral" />
        </View>
      </RadioButton.Group>

      <Button mode="outlined" onPress={pickImage}>Upload Profile Photo</Button>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, borderRadius: 50, marginVertical: 10, alignSelf: 'center' }} />
      )}

      <Button mode="contained" onPress={handleRegister} style={styles.button}>Register</Button>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { marginBottom: 16 },
  label: { marginTop: 12, fontSize: 16, fontWeight: '600' },
  radioGroup: { marginVertical: 8 },
  button: { marginVertical: 16 },
  link: { textAlign: 'center', color: '#007AFF' },
});
