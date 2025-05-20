import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';
import { Picker } from '@react-native-picker/picker';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { categories } from '../constants/backendUri';

interface Props {
  visible: boolean;
  onClose: () => void;
  onTransactionAdded?: () => void;
}

const ManualTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  onTransactionAdded,
}) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory('');
  };

  const handleSubmit = async () => {
    if (!amount || !type || !category) {
      Alert.alert('All fields except description are required');
      return;
    }

    try {
      const res = await fetchWithAuth(`${Backend}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type,
          category,
          description: description || category,
          date,
        }),
      });
      if (!res) throw new Error("Request failed");
      if (!res.ok) throw new Error('Failed to create transaction');

      Alert.alert('Transaction added!');
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date());

      onTransactionAdded?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.modal}>
              <Text style={styles.header}>Add Transaction</Text>

              <TextInput
                placeholder="Amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
                placeholderTextColor="gray"
              />

              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'expense' && styles.selected,
                  ]}
                  onPress={() => handleTypeChange('expense')}
                >
                  <Text style={styles.typeText}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    type === 'income' && styles.selected,
                  ]}
                  onPress={() => handleTypeChange('income')}
                >
                  <Text style={styles.typeText}>Income</Text>
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

              <TouchableOpacity
                onPress={() => setDatePickerVisible(true)}
                style={styles.datePickerButton}
              >
                <Text style={styles.datePickerText}>
                  📅 {dayjs(date).format('YYYY-MM-DD')}
                </Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(selectedDate) => {
                  setDate(selectedDate);
                  setDatePickerVisible(false);
                }}
                onCancel={() => setDatePickerVisible(false)}
              />

              <TextInput
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                placeholderTextColor="gray"
              />

              <View style={styles.footerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitText}>Add</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
  },
  picker: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 12,
    color: '#000',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  selected: {
    backgroundColor: '#e0ffe0',
    borderColor: '#50c878',
  },
  typeText: {
    fontSize: 16,
    color: '#333',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#50c878',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default ManualTransactionModal;
