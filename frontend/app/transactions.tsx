import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

export default function TransactionsScreen() {
  const [groupedTransactions, setGroupedTransactions] = useState<{ title: string; data: any[] }[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetchWithAuth(`${Backend}/transactions`);
      if (!res) throw new Error('Request failed');
      const data = await res.json();
      const txs = data?.data || [];

      const grouped = txs.reduce((acc: any, tx: any) => {
        const date = dayjs(tx.date).format('MMMM D, YYYY');
        if (!acc[date]) acc[date] = [];
        acc[date].push(tx);
        return acc;
      }, {});

      const sectionListData = Object.keys(grouped).map((date) => ({
        title: date,
        data: grouped[date],
      }));

      setGroupedTransactions(sectionListData);
    })();
  }, []);

  return (
    <>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SectionList
          sections={groupedTransactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, { color: item.type === 'expense' ? 'red' : 'green' }]}>
                  {item.type === 'expense' ? '-' : '+'}${item.amount}
                </Text>
              </View>
            </View>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
        />

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
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 60,
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
