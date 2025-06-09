import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import BudgetModal from '../components/BudgetModal';
import * as Progress from 'react-native-progress';
import ManualTransactionModal from '../components/ManualTransactionModal';
import VoiceRecorderModal from '../components/VoiceRecorderModal';
import Carousel from 'react-native-reanimated-carousel';


const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [graphData, setGraphData] = useState<number[]>([]);
  const [graphLabels, setGraphLabels] = useState<string[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month());
  const [allBudgets, setAllBudgets] = useState<any[]>([]);


  const router = useRouter();
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));
  const isCurrentMonth = selectedMonth === dayjs().month();

  const updateMonthData = (txs: any[], month: number) => {
    const filtered = txs.filter((tx: any) => dayjs(tx.date).month() === month);
    const totalsByDay: { [date: string]: number } = {};
    filtered.forEach((tx: any) => {
      const dateStr = dayjs(tx.date).format('MMM D');
      totalsByDay[dateStr] = (totalsByDay[dateStr] || 0) + (tx.type === 'expense' ? -tx.amount : tx.amount);
    });
    const sortedDates = Object.keys(totalsByDay).sort((a, b) => dayjs(a, 'MMM D').unix() - dayjs(b, 'MMM D').unix());
    setGraphLabels(sortedDates);
    setGraphData(sortedDates.map((d) => totalsByDay[d]));
    const total = filtered.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    setTotalExpense(total);
    setTransactions(filtered.slice(0, 5));
  };

  const loadTransactions = async () => {
    const res = await fetchWithAuth(`${Backend}/transactions`);
    if (!res) throw new Error('Failed to fetch transactions');
    const data = await res.json();
    const txs = data?.data || [];
    const budgetRes = await fetchWithAuth(`${Backend}/budgets`);
    const budgetData = await budgetRes?.json();
    const activeBudget = budgetData?.data?.find((b: any) => b.isActive);
    if (activeBudget) {
      setBudgetAmount(activeBudget.amount);
      setRemainingBudget(activeBudget.remainingAmount);
    }
    setAllTransactions(txs);
    updateMonthData(txs, selectedMonth);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    updateMonthData(allTransactions, selectedMonth);
  }, [selectedMonth]);

  const chartData = {
    labels: graphLabels.length > 0 ? graphLabels : [''],
    datasets: [{ data: graphData.length > 0 ? graphData : [0], strokeWidth: 2 }],
  };

  const changeMonth = (direction: 'left' | 'right') => {
    setSelectedMonth((prev) => {
      const newMonth = direction === 'left' ? prev - 1 : prev + 1;
      return (newMonth + 12) % 12;
    });
  };

  const refreshBudgetAmount = async () => {
    const res = await fetchWithAuth(`${Backend}/budgets`);
    if (!res) throw new Error("Request failed");
    const data = await res.json();
    const activeBudget = data?.data?.find((b: any) => b.isActive);
    if (activeBudget) {
      setBudgetAmount(activeBudget.amount);
    } else {
      setBudgetAmount(0);
    }
  };

  const progress = budgetAmount > 0 ? Math.min(1, Math.max(0, (budgetAmount - remainingBudget) / budgetAmount)) : 0;
  const getProgressColor = (p: number) => p <= 0.3 ? '#50c878' : p <= 0.6 ? '#f4c430' : p <= 0.9 ? '#ff8c00' : '#ff4d4d';

  const today = new Date();

  let date = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  let day = today.toLocaleDateString('en-US', { weekday: 'long' });
  day = day.substring(0, 3)
  const handleVoiceTransactionAdded = async () => {
    await loadTransactions();
    setTimeout(() => setModalVisible(false), 250);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* Left Arrow */}
        <TouchableOpacity style={styles.arrowLeft} onPress={() => changeMonth('left')}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Right Arrow */}
        <TouchableOpacity
          style={[styles.arrowRight, isCurrentMonth && styles.disabledArrow]}
          onPress={() => !isCurrentMonth && changeMonth('right')}
          disabled={isCurrentMonth}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={isCurrentMonth ? 'rgba(255,255,255,0.4)' : 'white'}
          />
        </TouchableOpacity>
        <View style={StyleSheet.absoluteFill}>
          <LineChart
            data={chartData}
            width={screenWidth}
            height={180}
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={false}
            withVerticalLabels={false}
            chartConfig={{ backgroundGradientFrom: '#50c878', backgroundGradientTo: '#50c878', color: () => `rgba(255, 255, 255, 0.5)`, strokeWidth: 2 }}
            bezier
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, marginLeft: 0, padding: 0, width: screenWidth }}
          />
        </View>
        {/* Swipable Month Carousel */}
        <Carousel
          width={screenWidth}
          height={50}
          data={months}
          scrollAnimationDuration={300}
          onSnapToItem={(index) => setSelectedMonth(index)}
          style={{ marginBottom: 80 }}
          renderItem={({ item }) => (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.monthLabel}>{months[selectedMonth]}</Text>
            </View>
          )}
          defaultIndex={selectedMonth}
        />
        {/* Date and Expense Info */}
  <View style={styles.overlay}>
    <Text style={styles.dateTitle}>TODAY IS</Text>
    <Text style={styles.date}>{`${day}, ${date}`}</Text>
  </View>
  <View style={[styles.overlay, { top: 100 }]}>
    <Text style={styles.expenseTitle}>THIS MONTH'S SPEND</Text>
    <Text style={styles.expenseAmount}>${totalExpense.toFixed(2)}</Text>
  </View>
      </View>

      <TouchableOpacity style={styles.budgetOverlayBox} onPress={() => setShowBudgetModal(true)}>
        <Text style={styles.budgetEmoji}>👛</Text>
        <View>
          <Text style={styles.budgetLabel}>Spending Budget</Text>
          <Text style={styles.budgetAmount}>${budgetAmount.toFixed(2)}</Text>
        </View>
        <View style={{ marginTop: 8, marginLeft: 20 }}>
          {budgetAmount > 0 && (
            <Progress.Bar progress={progress} width={180} color={getProgressColor(progress)} unfilledColor="#e0e0e0" borderWidth={0} height={8} />
          )}
          <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
            Remaining: ${remainingBudget.toFixed(2)} of ${budgetAmount.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>

      <BudgetModal visible={showBudgetModal} onClose={() => setShowBudgetModal(false)} onBudgetChange={refreshBudgetAmount} />

      <View style={styles.bottomSection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {transactions.length > 0 ? 
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, { color: item.type === 'expense' ? 'red' : 'green' }]}> {item.type === 'expense' ? '-' : '+'}${item.amount} </Text>
                <Text style={styles.date2}>{dayjs(item.date).format('MMMM D, YYYY')}</Text>
              </View>
            </View>
          )}
        />
        : <Text style={styles.notTransaction}>No Transaction This Month</Text>}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => {}}><Ionicons name="home" size={24} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/transactions')}><MaterialIcons name="receipt" size={24} /></TouchableOpacity>
        <TouchableOpacity onPress={() => setShowOptions(!showOptions)} style={styles.addBtn}><Ionicons name="add" size={28} color="white" /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/recurring')}><Ionicons name="repeat" size={24} /></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/account')}><Ionicons name="person" size={24} /></TouchableOpacity>
      </View>

      {showOptions && (
        <View style={styles.floatingOptions}>
          <TouchableOpacity onPress={() => setManualModalVisible(true)} style={styles.optionBtn}><Text style={styles.optionEmoji}>⌨️</Text></TouchableOpacity>
          <VoiceRecorderModal visible={modalVisible} onClose={() => setModalVisible(false)} onTransactionAdded={handleVoiceTransactionAdded} />
          <TouchableOpacity onPress={() => setModalVisible(true)}><Ionicons name="mic" size={24} color="black" /></TouchableOpacity>
        </View>
      )}

      <ManualTransactionModal visible={manualModalVisible} onClose={() => setManualModalVisible(false)} onTransactionAdded={() => { loadTransactions(); setManualModalVisible(false); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  topSection: { height: '41%', justifyContent: 'center', backgroundColor: '#50c878', padding: 0, margin: 0 },
  monthSelector: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 8, gap: 10 },
  monthLabel: { fontSize: 16, color: 'white', fontWeight: '600' },
  overlay: { position: 'absolute', top:70, alignSelf: 'center', alignItems: 'center' },
  expenseTitle: { fontSize: 12, color: 'white', top:30 },
  expenseAmount: { fontSize: 32, fontWeight: 'bold', color: 'white', top:30 },
  dateTitle: { fontSize: 10, color: 'white' },
  date: { fontSize: 16, color: 'white' },
  bottomSection: { flex: 1, paddingHorizontal: 16, top: 40 },
  budgetOverlayBox: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 80,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  budgetEmoji: { fontSize: 28, marginRight: 12 },
  budgetLabel: { fontSize: 14, color: '#777' },
  budgetAmount: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  historyTitle: { fontSize: 16, fontWeight: 'bold' },
  seeAll: { color: '#00C781' },
  notTransaction:{textAlign: 'center', alignItems: 'center', color:'#777'},
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee' },
  category: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, color: '#666', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600' },
  date2: { fontSize: 12, color: '#999', marginTop: 2 },
  footer: { height: 70, borderTopWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  addBtn: { backgroundColor: '#000', width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: -30 },
  floatingOptions: { position: 'absolute', bottom: 80, alignSelf: 'center', flexDirection: 'row', gap: 12 },
  optionBtn: { backgroundColor: 'white', padding: 10, borderRadius: 25, elevation: 4 },
  optionEmoji: { fontSize: 20 },
  arrowLeft: {
    position: 'absolute',
    top: '45%',
    left: 10,
    zIndex: 10,
    backgroundColor: '#50c878',
    padding: 6,
    borderRadius: 20,
  },
  
  arrowRight: {
    position: 'absolute',
    top: '45%',
    right: 10,
    zIndex: 10,
    backgroundColor: '#50c878',
    padding: 6,
    borderRadius: 20,
  },
  disabledArrow: {
    opacity: 0.4,
  }
});
