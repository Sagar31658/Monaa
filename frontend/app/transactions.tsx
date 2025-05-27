import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as Print from 'expo-print';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { LineChart, PieChart } from 'react-native-chart-kit';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

const screenWidth = Dimensions.get('window').width;

export default function TransactionsScreen() {
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions'>('transactions');
  const [groupedTransactions, setGroupedTransactions] = useState<{ title: string; data: any[] }[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [ytdTotal, setYtdTotal] = useState(0);
  const [filter, setFilter] = useState<'Monthly' | 'YTD' | 'Weekly'>('Monthly');

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetchWithAuth(`${Backend}/transactions`);
      if (!res) throw new Error('Request failed');
      const data = await res.json();
      const txs = data?.data || [];
      setAllTransactions(txs);

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

      const currentMonth = dayjs().month();
      const currentYear = dayjs().year();

      const totalMonth = txs.filter(tx => dayjs(tx.date).month() === currentMonth && tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalYTD = txs.filter(tx => dayjs(tx.date).year() === currentYear && tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      setMonthlyTotal(totalMonth);
      setYtdTotal(totalYTD);
    })();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetchWithAuth(`${Backend}/transactions/${id}`, { method: 'DELETE' });
      setGroupedTransactions(prev =>
        prev.map(section => ({
          ...section,
          data: section.data.filter(tx => tx._id !== id),
        })).filter(section => section.data.length > 0)
      );
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const renderRightActions = (id: string) => (
    <RectButton style={styles.deleteButton} onPress={() => handleDelete(id)}>
      <Text style={styles.deleteButtonText}>Delete</Text>
    </RectButton>
  );

  const filteredTxs = allTransactions.filter((tx) => {
    const txDate = dayjs(tx.date);
    if (filter === 'Monthly') return txDate.month() === dayjs().month();
    if (filter === 'YTD') return txDate.year() === dayjs().year();
    if (filter === 'Weekly') return txDate.isAfter(dayjs().subtract(7, 'day'));
    return true;
  });

  const generatePieData = (txs: any[]) => {
    const expenses = txs.filter((tx) => tx.type === 'expense');
    const grouped: { [key: string]: number } = {};
    for (let tx of expenses) {
      grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount;
    }

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#50C878', '#f39c12', '#9b59b6'];
    return Object.keys(grouped).map((cat, i) => ({
      name: cat,
      amount: grouped[cat],
      color: colors[i % colors.length],
      legendFontColor: '#333',
      legendFontSize: 14,
    }));
  };

  const exportPDF = async () => {
    const html = `
      <h1>Transaction Summary</h1>
      <p><b>Filter:</b> ${filter}</p>
      <p><b>Monthly Total:</b> $${monthlyTotal.toFixed(2)}</p>
      <p><b>YTD Total:</b> $${ytdTotal.toFixed(2)}</p>
    `;
  
    const { uri } = await Print.printToFileAsync({ html });
    Alert.alert('PDF Saved', `File saved to: ${uri}`);
  };
  
  

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea}>
  <View style={styles.container}>
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
        onPress={() => setActiveTab('summary')}
      >
        <Text style={styles.tabText}>Summary</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
        onPress={() => setActiveTab('transactions')}
      >
        <Text style={styles.tabText}>Transactions</Text>
      </TouchableOpacity>
    </View>

    {activeTab === 'transactions' ? (
      <SectionList
        contentContainerStyle={{ paddingBottom: 20 }}
        sections={groupedTransactions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item._id)}>
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
          </Swipeable>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
      />
    ) : (
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.filterRow}>
          {['Monthly', 'YTD', 'Weekly'].map((label) => (
            <TouchableOpacity
              key={label}
              onPress={() => setFilter(label as any)}
              style={[styles.filterButton, filter === label && styles.activeFilter]}
            >
              <Text>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.summaryTitle}>📊 Transaction Summary</Text>
        <Text style={styles.summaryItem}>• Monthly Expense: ${monthlyTotal.toFixed(2)}</Text>
        <Text style={styles.summaryItem}>• Year-To-Date Expense: ${ytdTotal.toFixed(2)}</Text>

        <Text style={[styles.summaryItem, { marginTop: 20 }]}>📈 Daily Expense Trend</Text>
        <LineChart
          data={{
            labels: filteredTxs.map(tx => dayjs(tx.date).format('D')).slice(0, 7),
            datasets: [{
              data: filteredTxs.filter(tx => tx.type === 'expense').map(tx => tx.amount).slice(0, 7),
            }],
          }}
          width={screenWidth - 32}
          height={220}
          yAxisLabel="$"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#e0f7e9',
            backgroundGradientTo: '#b2dfdb',
            color: () => '#00695c',
            labelColor: () => '#333',
            strokeWidth: 2,
          }}
          style={{ marginVertical: 10 }}
        />

        <Text style={[styles.summaryItem, { marginTop: 20 }]}>📂 Expenses by Category</Text>
        <PieChart
          data={generatePieData(filteredTxs)}
          width={screenWidth - 32}
          height={220}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          chartConfig={{
            color: () => '#000',
            labelColor: () => '#000',
          }}
          absolute
        />

        <TouchableOpacity
          onPress={exportPDF}
          style={{ marginTop: 20, backgroundColor: '#00C781', padding: 10, borderRadius: 6 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Export to PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    )}

    {/* Common Footer */}
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
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, paddingHorizontal: 16 },
  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  tab: {
    flex: 1,
    padding: 10,
    borderBottomWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
  },
  activeTab: { borderColor: '#00C781' },
  tabText: { fontWeight: '600', fontSize: 16 },
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
  category: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, color: '#666', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600' },
  footer: {
    height: 60,
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor:'white'
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    flex: 1,
  },
  deleteButtonText: { color: 'white', fontWeight: 'bold' },
  summaryTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  summaryItem: { fontSize: 16, marginVertical: 4, color: '#333' },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 },
  filterButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#eee' },
  activeFilter: { backgroundColor: '#00C781' },
});
