import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { logoutUser } from '../utils/Auth';
import { router } from 'expo-router';
import { Backend } from '../constants/backendUri';

const LogoutButton = () => {
  const handleLogout = async () => {
    try {
      await fetch(`${Backend}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Logout request failed:', err);
    }

    await logoutUser();
    Alert.alert('Logged out', 'You have been signed out.');
    router.replace('/login');
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.button}>
      <Text style={styles.text}>Log Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LogoutButton;
