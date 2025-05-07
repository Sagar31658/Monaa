import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';

import DateTimePickerModal from 'react-native-modal-datetime-picker';

import dayjs from 'dayjs';


interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onBudgetChange?: () => void;
}

export default function BudgetModal({ visible, onClose, onBudgetChange }: BudgetModalProps) {
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [threshold, setThreshold] = useState('');
  const [activeBudget, setActiveBudget] = useState<any>(null);
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) fetchBudgets();
  }, [visible]);

  const fetchBudgets = async () => {
    const res = await fetchWithAuth(`${Backend}/budgets`);
    const json = await res.json();
    const budget = json?.data?.find((b: any) => b.isActive);
    if (budget) setActiveBudget(budget);
  };

  const createBudget = async () => {
    if (!amount || !startDate || !endDate) {
      Alert.alert('Please fill all required fields');
      return;
    }
    const res = await fetchWithAuth(`${Backend}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Monthly Budget',
        amount,
        startDate,
        endDate,
        warningThreshold: threshold || 80,
      }),
    });

    if (res.ok) {
      Alert.alert('Budget created!');
      fetchBudgets();
      setAmount('');
      setStartDate('');
      setEndDate('');
      setThreshold('');
      onBudgetChange?.();
    } else {
      const error = await res.json();
      Alert.alert('Error', error.message || 'Failed to create budget');
    }
  };

  const deleteBudget = async () => {
    if (!activeBudget) return;
    const res = await fetchWithAuth(`${Backend}/budgets/${activeBudget._id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      Alert.alert('Budget deleted');
      setActiveBudget(null);
      onBudgetChange?.();
    } else {
      const error = await res.json();
      Alert.alert('Error', error.message || 'Failed to delete');
    }
  };

  return (
        <Modal visible={visible} animationType="slide" transparent>
          <View style={styles.overlay}>
            <View style={styles.modalBox}>
              <ScrollView>
                <Text style={styles.title}>🎯 Manage Your Budget</Text>
      
                {activeBudget ? (
                  <View style={styles.budgetInfo}>
                    <Text style={styles.label}>Current Budget</Text>
                    <Text>💰 ${activeBudget.amount}</Text>
                    <Text>📅 {new Date(activeBudget.startDate).toDateString()} to {new Date(activeBudget.endDate).toDateString()}</Text>
                    <Text>⚠️ Threshold: {activeBudget.warningThreshold}%</Text>
                    <TouchableOpacity onPress={deleteBudget} style={styles.deleteBtn}>
                      <Text style={styles.deleteText}>Delete Budget</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />
      
                    <Text style={styles.label}>Start Date</Text>
<TouchableOpacity onPress={() => setStartPickerVisible(true)} style={styles.dateInput}>
  <Text style={{ color: selectedStartDate ? '#333' : '#888' }}>
    {selectedStartDate ? dayjs(selectedStartDate).format('YYYY-MM-DD') : 'Select start date'}
  </Text>
</TouchableOpacity>
<DateTimePickerModal
  isVisible={isStartPickerVisible}
  mode="date"
  onConfirm={(date) => {
    setStartPickerVisible(false);
    setSelectedStartDate(date);
    setStartDate(dayjs(date).format('YYYY-MM-DD'));
  }}
  onCancel={() => setStartPickerVisible(false)}
/>

<Text style={styles.label}>End Date</Text>
<TouchableOpacity onPress={() => setEndPickerVisible(true)} style={styles.dateInput}>
  <Text style={{ color: selectedEndDate ? '#333' : '#888' }}>
    {selectedEndDate ? dayjs(selectedEndDate).format('YYYY-MM-DD') : 'Select end date'}
  </Text>
</TouchableOpacity>
<DateTimePickerModal
  isVisible={isEndPickerVisible}
  mode="date"
  onConfirm={(date) => {
    setEndPickerVisible(false);
    setSelectedEndDate(date);
    setEndDate(dayjs(date).format('YYYY-MM-DD'));
  }}
  onCancel={() => setEndPickerVisible(false)}
/>

      
                    <Text style={styles.label}>Warning Threshold %</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={threshold} onChangeText={setThreshold} />
      
                    <TouchableOpacity style={styles.saveBtn} onPress={createBudget}>
                      <Text style={styles.saveText}>Create Budget</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>      
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  label: { marginTop: 10, fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, marginTop: 4,
  },
  saveBtn: {
    backgroundColor: '#50c878', padding: 10, marginTop: 16, borderRadius: 8, alignItems: 'center',
  },
  saveText: { color: 'white', fontWeight: '600' },
  closeBtn: { marginTop: 20, alignItems: 'center' },
  closeText: { color: '#555' },
  budgetInfo: {
    paddingVertical: 10,
    gap: 4,
  },
  deleteBtn: {
    marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#eee', padding: 8, borderRadius: 6,
  },
  deleteText: { color: '#d00' },
  dateInput: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 6,
  padding: 10,
  marginTop: 4,
  backgroundColor: '#f9f9f9',
},
});
