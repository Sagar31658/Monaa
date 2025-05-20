// components/RecurringItemModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { categories } from '../constants/backendUri';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';

interface Props {
  visible: boolean;
  onClose: () => void;
  onItemCreated?: () => void;
}

const RecurringItemModal: React.FC<Props> = ({ visible, onClose, onItemCreated }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !type || !category || !frequency || !nextDueDate) {
      Alert.alert('All fields except description are required');
      return;
    }

    try {
      const response = await fetchWithAuth(`${Backend}/recurring-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category,
          description,
          frequency,
          nextDueDate,
        }),
      });

      if (!response?.ok) throw new Error('Failed to create recurring item');
      Alert.alert('Success', 'Recurring item created');
      onItemCreated?.();
      onClose();
      resetForm();
    } catch {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setFrequency('monthly');
    setNextDueDate(new Date());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <View style={styles.modal}>
              <Text style={styles.header}>Add Recurring Item</Text>

              <TextInput placeholder="Amount" placeholderTextColor="gray" keyboardType="numeric" value={amount} onChangeText={setAmount} style={styles.input} />
              <TextInput placeholder="Description (optional)" placeholderTextColor="gray" value={description} onChangeText={setDescription} style={styles.input} />

              <View style={styles.row}>
                <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.selected]} onPress={() => setType('expense')}>
                  <Text>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.selected]} onPress={() => setType('income')}>
                  <Text>Income</Text>
                </TouchableOpacity>
              </View>

              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
                itemStyle={{ color: '#000' }}
              >
                <Picker.Item label="Select Category" value="" />
                {categories[type].map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>

              <Picker selectedValue={frequency} onValueChange={setFrequency} style={styles.picker} itemStyle={{ color: '#000' }}>
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Yearly" value="yearly" />
              </Picker>

              <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.datePickerBtn}>
                <Text>📅 {nextDueDate.toDateString()}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                  setNextDueDate(date);
                  setDatePickerVisible(false);
                }}
                onCancel={() => setDatePickerVisible(false)}
              />

              <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
                  <Text style={styles.saveText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { width: '100%', alignItems: 'center'},
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '100%',
  },
  header: { fontSize: 20, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  selected: { backgroundColor: '#e0ffe0', borderColor: '#50c878' },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    color: '#000',
  },
  datePickerBtn: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    color:'#000'
  },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    marginRight: 10,
    padding: 12,
    backgroundColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#333', fontWeight: '500' },
  saveBtn: {
    flex: 1,
    marginLeft: 10,
    padding: 12,
    backgroundColor: '#50c878',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: { color: 'white', fontWeight: '600' },
});

export default RecurringItemModal;
