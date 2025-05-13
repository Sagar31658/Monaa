import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Backend } from '../constants/backendUri';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs'
import BudgetModal from '../components/BudgetModal';
import * as Progress from 'react-native-progress';
import ManualTransactionModal from '../components/ManualTransactionModal';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [manualModalVisible, setManualModalVisible] = useState(false);


  const router = useRouter();

  const loadTransactions = async () => {
    const res = await fetchWithAuth(`${Backend}/transactions`);
    const data = await res.json();
    const txs = data?.data || [];
  
    const budgetRes = await fetchWithAuth(`${Backend}/budgets`);
    const budgetData = await budgetRes.json();
    const activeBudget = budgetData?.data?.find((b: any) => b.isActive);
  
    if (activeBudget) {
      setBudgetAmount(activeBudget.amount);
      setRemainingBudget(activeBudget.remainingAmount);
    }
  
    setTransactions(txs.slice(0, 6));
  
    const thisMonth = new Date().getMonth();
    const total = txs
      .filter((tx: any) => tx.type === 'expense' && new Date(tx.date).getMonth() === thisMonth)
      .reduce((sum: number, tx: any) => sum + tx.amount, 0);
    setTotalExpense(total);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const chartData = {
    labels: [],
    datasets: [
      {
        data: [0, 20, 5, 15, 10, 30],
        strokeWidth: 2,
      },
    ],
  };

  const today = new Date();

  let date = today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  let day = today.toLocaleDateString('en-US', { weekday: 'long' });
  day = day.substring(0, 3)

  const refreshBudgetAmount = async () => {
    const res = await fetchWithAuth(`${Backend}/budgets`);
    const data = await res.json();
    const activeBudget = data?.data?.find((b: any) => b.isActive);
    if (activeBudget) {
      setBudgetAmount(activeBudget.amount);
    } else {
      setBudgetAmount(0);
    }
  };
  

  return (
    <View style={styles.container}>
      {/* Top 40%: Chart with overlay */}
      <View style={styles.topSection}>
        <View style={StyleSheet.absoluteFill}>
            <LineChart
            data={chartData}
            width={screenWidth}
            height={200}
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withHorizontalLabels={false}
            withVerticalLabels={false}
            chartConfig={{
                backgroundGradientFrom: '#50c878',
                backgroundGradientTo: '#50c878',
                color: () => `rgba(255, 255, 255, 0.5)`,
                strokeWidth: 2,
            }}
            bezier
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                marginLeft: 0,
                padding: 0,
                width: screenWidth
            }}
            />
        </View>
        <View style={styles.overlay}>
          <Text style={styles.dateTitle}>TODAY IS</Text>
          <Text style={styles.date}>{`${day}, ${date}`}</Text>  
        </View>
        <View style={styles.overlay}>
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
      <View style={{ marginTop: 8, marginLeft:20 }}>
  <Progress.Bar
    progress={(budgetAmount - remainingBudget) / budgetAmount}
    width={180}
    color="#50c878"
    unfilledColor="#e0e0e0"
    borderWidth={0}
    height={8}
  />
  <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
    Remaining: ${remainingBudget.toFixed(2)} of ${budgetAmount.toFixed(2)}
  </Text>
</View>

    </TouchableOpacity>

      <BudgetModal visible={showBudgetModal} onClose={() => setShowBudgetModal(false)} onBudgetChange={refreshBudgetAmount} />


      {/* Bottom 60%: Transaction History */}
      <View style={styles.bottomSection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

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
        <Text style={[styles.amount, { color: item.type === 'expense' ? 'red' : 'green' }]}>
          {item.type === 'expense' ? '-' : '+'}${item.amount}
        </Text>
        <Text style={styles.date2}>{dayjs(item.date).format('MMMM D, YYYY')}</Text>
      </View>
    </View>
  )}
/>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="home" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/transactions')}>
          <MaterialIcons name="receipt" size={24} />
        </TouchableOpacity>

        {/* Add Button */}
        <TouchableOpacity onPress={() => setShowOptions(!showOptions)} style={styles.addBtn}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/recurring')}>
          <Ionicons name="repeat" size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/account')}>
          <Ionicons name="person" size={24} />
        </TouchableOpacity>
      </View>

      {/* Floating options for add */}
      {showOptions && (
        <View style={styles.floatingOptions}>
          <TouchableOpacity onPress={() => setManualModalVisible(true)} style={styles.optionBtn}>
            <Text style={styles.optionEmoji}>⌨️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/add-voice')} style={styles.optionBtn}>
            <Text style={styles.optionEmoji}>🎤</Text>
          </TouchableOpacity>
        </View>
      )}
      <ManualTransactionModal
  visible={manualModalVisible}
  onClose={() => setManualModalVisible(false)}
  onTransactionAdded={() => {
    loadTransactions();
    setManualModalVisible(false);
  }}
/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  topSection: { height: '41%', justifyContent: 'center', backgroundColor: '#50c878', padding: 0, margin: 0 },
  overlay: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    alignItems: 'center',
  },
  dateTitle: { fontSize: 10, color: 'white' },
  date: { fontSize: 16, color: 'white' },
  expenseTitle: { fontSize: 10, color: 'white', top:60 },
  expenseAmount: { fontSize: 48, fontWeight: 'bold', color: 'white', top:60 },
  bottomSection: { flex: 1, paddingHorizontal: 16, top: 40 },
  budgetOverlayBox: {
    position: 'absolute',
    top: '38%',
    alignSelf: "center",
    flexDirection: 'row',
    alignItems: "stretch",
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
  budgetEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#777',
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  historyTitle: { fontSize: 16, fontWeight: 'bold' },
  seeAll: { color: '#00C781' },
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
  date2: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },  
  footer: {
    height: 60,
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#000',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  floatingOptions: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    elevation: 4,
  },
  optionEmoji: {
    fontSize: 20,
  },
});
