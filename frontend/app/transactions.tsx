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
  Modal,
  Platform,
} from 'react-native';
import * as Print from 'expo-print';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { PieChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get('window').width;
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TransactionsScreen() {
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions'>('summary');
  const [groupedTransactions, setGroupedTransactions] = useState<{ title: string; data: any[] }[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [summaryTab, setSummaryTab] = useState<'Monthly' | 'YTD'>('Monthly');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempMonth, setTempMonth] = useState(selectedDate.getMonth());
  const [tempYear, setTempYear] = useState(selectedDate.getFullYear());
  const [budgets, setBudgets] = useState<any[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);

  const summaryTabs = ['Monthly', 'YTD'];
  const router = useRouter();
  const selectedMonthIndex = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  useEffect(() => {
    (async () => {
      try {
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
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const filteredTxs = (allTransactions || []).filter((tx) => {
    const txDate = dayjs(tx.date);
    const isExpense = tx.type === 'expense';
    if (summaryTab === 'Monthly') {
      return isExpense && txDate.month() === selectedMonthIndex && txDate.year() === selectedYear;
    } else {
      return isExpense && txDate.year() === dayjs().year();
    }
  });

  const totalExpense = (filteredTxs || []).reduce((sum, tx) => sum + tx.amount, 0);

  const grouped = (filteredTxs || []).reduce((acc, tx) => {
    acc[tx.category] = acc[tx.category] || { amount: 0, count: 0 };
    acc[tx.category].amount += tx.amount;
    acc[tx.category].count++;
    return acc;
  }, {} as { [category: string]: { amount: number; count: number } });

  const colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#A142F4', '#FF6D01'];
  const pieData = Object.entries(grouped).map(([cat, val], i) => ({
    value: val.amount,
    text: cat,
    color: colors[i % colors.length],
    textColor: '#333',
  }));

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
    <RectButton style={{ backgroundColor: 'red', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, flex: 1 }} onPress={() => handleDelete(id)}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
    </RectButton>
  );

  const exportPDF = async () => {
  const pieRows = Object.entries(grouped)
    .map(([category, { amount, count }], i) => {
      const color = colors[i % colors.length];
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;">
            <div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 7px;"></div>
          </td>
          <td style="padding: 8px; border: 1px solid #ccc;">${category}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${count} transaction${count > 1 ? 's' : ''}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">$${amount.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #00C781; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { text-align: left; }
        </style>
      </head>
      <body>
        <h1>Transaction Breakdown</h1>
        <p><strong>Month:</strong> ${dayjs(selectedDate).format('MMMM YYYY')}</p>
        <p><strong>Total Expense:</strong> $${totalExpense.toFixed(2)}</p>

        <table>
          <thead>
            <tr>
              <th style="border: 1px solid #ccc;"></th>
              <th style="border: 1px solid #ccc;">Category</th>
              <th style="border: 1px solid #ccc;">Transactions</th>
              <th style="border: 1px solid #ccc;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${pieRows}
          </tbody>
        </table>

        <p style="margin-top: 30px; font-size: 14px; color: #555;">Generated by Monaa - Your AI Expense Tracker</p>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  } else {
    Alert.alert('PDF Saved', `File saved to: ${uri}`);
  }
};

  const applyMonthSelection = () => {
    const now = new Date();
    if (tempYear > now.getFullYear() || (tempYear === now.getFullYear() && tempMonth > now.getMonth())) {
      Alert.alert('Invalid Selection', 'Future months are not allowed.');
      return;
    }
    setSelectedDate(new Date(tempYear, tempMonth));
    setShowMonthPicker(false);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
            <TouchableOpacity
              style={[{ flex: 1, padding: 10, borderBottomWidth: 2, borderColor: '#eee', alignItems: 'center' }, activeTab === 'summary' && { borderColor: '#00C781' }]}
              onPress={() => setActiveTab('summary')}
            >
              <Text style={{ fontWeight: '600', fontSize: 16 }}>Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[{ flex: 1, padding: 10, borderBottomWidth: 2, borderColor: '#eee', alignItems: 'center' }, activeTab === 'transactions' && { borderColor: '#00C781' }]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={{ fontWeight: '600', fontSize: 16 }}>Transactions</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'transactions' ? (
            <SectionList
              contentContainerStyle={{ paddingBottom: 20 }}
              sections={groupedTransactions}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Swipeable renderRightActions={() => renderRightActions(item._id)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.category}</Text>
                      <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{item.description}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: item.type === 'expense' ? 'red' : 'green' }}>${item.amount}</Text>
                    </View>
                  </View>
                </Swipeable>
              )}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={{ backgroundColor: '#f0f0f0', paddingVertical: 6, fontSize: 16, fontWeight: '600', color: '#444', marginTop: 12 }}>{title}</Text>
              )}
            />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 40, flexDirection:'column' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 22, fontWeight: '700' }}>Summary</Text>
                {summaryTab === 'Monthly' && (
                  <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
                    <Text style={{ backgroundColor: '#eee', padding: 8, borderRadius: 6 }}>{dayjs(selectedDate).format('MMMM YYYY')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                {summaryTabs.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[{ paddingVertical: 6, paddingHorizontal: 16, borderBottomWidth: 2, borderColor: 'transparent' }, summaryTab === tab && { borderColor: '#00C781' }]}
                    onPress={() => setSummaryTab(tab as 'Monthly' | 'YTD')}
                  >
                    <Text style={{ color: summaryTab === tab ? '#00C781' : '#888', fontWeight: '600', fontSize: 15 }}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Modal visible={showMonthPicker} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000088' }}>
                  <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '80%' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>Select Month & Year</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {months.map((month, index) => {
                        const isFuture =
                          tempYear === new Date().getFullYear() &&
                          index > new Date().getMonth();

                        return (
                          <TouchableOpacity
                            key={month}
                            onPress={() => !isFuture && setTempMonth(index)}
                            style={{
                              marginRight: 10,
                              opacity: isFuture ? 0.3 : 1,
                            }}
                            disabled={isFuture}
                          >
                            <Text
                              style={{
                                padding: 10,
                                borderWidth: 1,
                                borderColor: tempMonth === index && !isFuture ? '#00C781' : '#ccc',
                                borderRadius: 6,
                                color: isFuture ? '#aaa' : '#000',
                              }}
                            >
                              {month}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                      {years.map((year) => (
                        <TouchableOpacity key={year} onPress={() => setTempYear(year)} style={{ marginRight: 10 }}>
                          <Text style={{ padding: 10, borderWidth: 1, borderColor: tempYear === year ? '#00C781' : '#ccc', borderRadius: 6 }}>{year}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity onPress={applyMonthSelection} style={{ marginTop: 20, backgroundColor: '#00C781', padding: 10, borderRadius: 6 }}>
                      <Text style={{ color: 'white', textAlign: 'center' }}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {pieData.length > 0 ? (
                <PieChart
                  data={pieData}
                  showText
                  textColor="black"
                  textSize={14}
                  showValuesAsLabels
                  radius={120}
                  innerRadius={60}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center'}}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>Amount</Text>
                      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>${totalExpense.toFixed(0)}</Text>
                    </View>
                  )}
                />
              ) : (
                <Text style={{ textAlign: 'center', marginVertical: 20 }}>No data for this period</Text>
              )}

              {Object.entries(grouped).map(([category, { amount, count }], i) => (
                <View key={category} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors[i % colors.length], marginRight: 8 }} />
                    <Text style={{ fontSize: 16 }}>{category}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'right' }}>${amount.toFixed(2)}</Text>
                    <Text style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>{count} Transactions</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity onPress={exportPDF} style={{ marginTop: 20, backgroundColor: '#00C781', padding: 10, borderRadius: 6 }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Export to PDF</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          <View style={{ height: 60, borderTopWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white' }}>
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
  tab: { flex: 1, padding: 10, borderBottomWidth: 2, borderColor: '#eee', alignItems: 'center' },
  activeTab: { borderColor: '#00C781' },
  tabText: { fontWeight: '600', fontSize: 16 },
  sectionHeader: { backgroundColor: '#f0f0f0', paddingVertical: 6, fontSize: 16, fontWeight: '600', color: '#444', marginTop: 12 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee' },
  category: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, color: '#666', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600' },
  footer: { height: 60, borderTopWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white' },
  deleteButton: { backgroundColor: 'red', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, flex: 1 },
  deleteButtonText: { color: 'white', fontWeight: 'bold' },
  summaryTitle: { fontSize: 22, fontWeight: '700' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthSelector: { backgroundColor: '#eee', padding: 8, borderRadius: 6 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'center' },
  categoryText: { fontSize: 16, marginLeft: 8 },
  amountText: { fontSize: 16, fontWeight: '600', textAlign: 'right' },
  transactionCount: { fontSize: 12, color: '#666', textAlign: 'right' },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  summaryTabs: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  summaryTab: { paddingVertical: 6, paddingHorizontal: 16, borderBottomWidth: 2, borderColor: 'transparent' },
  activeSummaryTab: { borderColor: '#00C781' },
  summaryTabText: { color: '#888', fontWeight: '600', fontSize: 15 },
  activeSummaryTabText: { color: '#00C781' },
});
