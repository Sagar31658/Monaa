import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import dayjs from 'dayjs';
import CreateRecurringModal from '../components/recurringItemModal';

export default function RecurringScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const loadItems = async () => {
    const res = await fetchWithAuth(`${Backend}/recurring-items`);
    if (!res) return;
    const data = await res.json();
    let list = data?.data || [];

    list = list.sort(
      (a, b) =>
        new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
    );

    if (activeOnly) list = list.filter((i) => i.isActive);
    setItems(list);
  };

  useEffect(() => {
    loadItems();
  }, [activeOnly]);

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await fetchWithAuth(`${Backend}/recurring-items/${id}`, {
            method: 'DELETE',
          });
          loadItems();
        },
      },
    ]);
  };

  const handleToggle = async (id: string) => {
    await fetchWithAuth(`${Backend}/recurring-items/${id}/toggle`, {
      method: 'PATCH',
    });
    loadItems();
  };

  const getCategoryEmoji = (cat: string) => {
    const emojiMap: Record<string, string> = {
      Salary: '💰',
      Rent: '🏠',
      Food: '🍔',
      Transport: '🚗',
      Health: '💊',
      Subscription: '📺',
      Other: '📦',
    };
    return emojiMap[cat] || '📝';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Recurring Items</Text>
        </View>

        <TouchableOpacity
          onPress={() => setActiveOnly((prev) => !prev)}
          style={styles.filterBtn}
        >
          <Text style={{ color: '#50c878', fontWeight: 'bold' }}>
            {activeOnly ? 'Show All' : 'Show Active Only'}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.itemBox}>
              <View>
                <Text style={styles.category}>
                  {getCategoryEmoji(item.category)} {item.category}
                </Text>
                <Text style={styles.category}>{item.description}</Text>
                <Text style={styles.meta}>
                  {item.frequency.toUpperCase()} | Due{' '}
                  {dayjs(item.nextDueDate).format('MMM D')}
                </Text>
                <Text style={styles.amount}>${item.amount}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleToggle(item._id)}>
                  <MaterialIcons
                    name={
                      item.isActive ? 'pause-circle' : 'play-circle'
                    }
                    size={26}
                    color="#555"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)}>
                  <Ionicons name="trash" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {/* Add New Floating Button */}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={styles.floatingBtn}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        {/* Create Recurring Modal */}
        <CreateRecurringModal
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            loadItems();
          }}
        />

        {/* Bottom Tab Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Ionicons name="home" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <MaterialIcons name="receipt" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/recurring')}>
            <Ionicons name="repeat" size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/account')}>
            <Ionicons name="person" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemBox: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 12, color: '#666' },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#333',
  },
  actions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  filterBtn: { marginVertical: 8, alignSelf: 'flex-end' },
  footer: {
    height: 60,
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#50c878',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
