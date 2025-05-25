import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { InteractionManager } from 'react-native';


interface Props {
  visible: boolean;
  data: any;
  onClose: () => void;
  onConfirmed?: () => void;
}

const VoiceConfirmModal: React.FC<Props> = ({ visible, data, onClose, onConfirmed }) => {
  const handleConfirm = async () => {
    try {
      const res = await fetchWithAuth(`${Backend}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(data.amount),
          type: data.type,
          category: data.category,
          description: data.description || data.category,
          date: new Date(),
          createdFrom: 'voice',
        }),
      });
  
      if (!res) throw new Error("Request failed");
      if (!res.ok) throw new Error('Failed to create transaction');
  
      Alert.alert('Transaction added!');
  
      // SAFELY wait before dismissing modals and refreshing
      onClose();
      InteractionManager.runAfterInteractions(() => {
        onConfirmed?.();
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Confirm Transaction</Text>
          <Text>💵 Amount: ${data?.amount}</Text>
          <Text>📂 Category: {data?.category}</Text>
          <Text>Description: {data?.description}</Text>
          <Text>📌 Type: {data?.type}</Text>
          <Text>📅 Date: {new Date(data?.date).toDateString()}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <Text style={{ color: '#333' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirm} onPress={handleConfirm}>
              <Text style={{ color: 'white' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center'
  },
  modal: {
    backgroundColor: 'white', padding: 20, borderRadius: 12, width: '85%',
  },
  header: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  actions: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 16,
  },
  cancel: {
    backgroundColor: '#eee', padding: 12, borderRadius: 8, flex: 1, marginRight: 8,
    alignItems: 'center',
  },
  confirm: {
    backgroundColor: '#50c878', padding: 12, borderRadius: 8, flex: 1,
    alignItems: 'center',
  },
});

export default VoiceConfirmModal;
