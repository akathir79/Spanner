import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface WalletData {
  wallet: {
    id: string;
    balance: string;
    totalTopupAmount: string;
    totalEarned: string;
    totalSpent: string;
    lastTopupAt?: string;
    lastTransactionAt?: string;
  };
  recentTransactions: Array<{
    id: string;
    type: 'credit' | 'debit';
    category: string;
    amount: string;
    description: string;
    status: string;
    createdAt: string;
    razorpayPaymentId?: string;
  }>;
  paymentMethods: Record<string, {
    name: string;
    description: string;
    icon: string;
    popular: boolean;
  }>;
}

const API_BASE_URL = 'http://localhost:5000';

export default function Wallet() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet`, {
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers here when available
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        throw new Error('Failed to fetch wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount < 10) {
      Alert.alert('Minimum Amount', 'Minimum topup amount is ₹10');
      return;
    }

    if (amount > 50000) {
      Alert.alert('Maximum Amount', 'Maximum topup amount is ₹50,000');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Create payment order
      const orderResponse = await fetch(`${API_BASE_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      
      // In a real mobile app, you would integrate Razorpay mobile SDK here
      // For now, we'll open the web payment URL
      const paymentUrl = `${API_BASE_URL}/api/wallet/mobile-payment?orderId=${orderData.order.orderId}&amount=${amount}`;
      
      Alert.alert(
        'Payment',
        'You will be redirected to complete the payment',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              Linking.openURL(paymentUrl);
              setShowTopupModal(false);
              setTopupAmount('');
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Payment Error', 'Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'pending':
        return styles.statusPending;
      case 'failed':
        return styles.statusFailed;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'refresh';
    }
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !walletData) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="wallet" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet" size={24} color="white" />
          <Text style={styles.balanceTitle}>Wallet Balance</Text>
        </View>
        
        <Text style={styles.balanceAmount}>
          {formatCurrency(walletData?.wallet.balance || '0')}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValue}>
              ₹{parseFloat(walletData?.wallet.totalEarned || '0').toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>
              ₹{parseFloat(walletData?.wallet.totalSpent || '0').toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Topped Up</Text>
            <Text style={styles.statValue}>
              ₹{parseFloat(walletData?.wallet.totalTopupAmount || '0').toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Top Up Button */}
      <TouchableOpacity
        style={styles.topupButton}
        onPress={() => setShowTopupModal(true)}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.topupButtonText}>Top Up Wallet</Text>
      </TouchableOpacity>

      {/* Recent Transactions */}
      <View style={styles.transactionsCard}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        {!walletData?.recentTransactions.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>
              No transactions yet. Top up your wallet to get started!
            </Text>
          </View>
        ) : (
          walletData.recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  transaction.type === 'credit' ? styles.creditIcon : styles.debitIcon
                ]}>
                  <Ionicons
                    name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color="white"
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.transactionRight}>
                <View style={styles.transactionStatus}>
                  <Ionicons
                    name={getStatusIcon(transaction.status)}
                    size={16}
                    color={getStatusColor(transaction.status).color}
                  />
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount
                ]}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Top Up Modal */}
      <Modal
        visible={showTopupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTopupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Wallet</Text>
              <TouchableOpacity
                onPress={() => setShowTopupModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.amountInput}
              value={topupAmount}
              onChangeText={setTopupAmount}
              placeholder="Enter amount (min ₹10, max ₹50,000)"
              keyboardType="numeric"
            />
            
            <View style={styles.quickAmountContainer}>
              {[100, 500, 1000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setTopupAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>₹{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.paymentMethodsLabel}>Available Payment Methods</Text>
            <View style={styles.paymentMethodsContainer}>
              {Object.entries(walletData?.paymentMethods || {}).map(([key, method]) => (
                <View key={key} style={styles.paymentMethod}>
                  <Ionicons name="card" size={20} color="#2563eb" />
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                    <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                  </View>
                  {method.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.processButton, processingPayment && styles.processingButton]}
              onPress={handleTopup}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <Text style={styles.processButtonText}>Processing...</Text>
              ) : (
                <>
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.processButtonText}>
                    Top Up ₹{topupAmount || '0'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  topupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  topupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  transactionsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  creditIcon: {
    backgroundColor: '#16a34a',
  },
  debitIcon: {
    backgroundColor: '#dc2626',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionStatus: {
    marginBottom: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  creditAmount: {
    color: '#16a34a',
  },
  debitAmount: {
    color: '#dc2626',
  },
  statusCompleted: {
    color: '#16a34a',
  },
  statusPending: {
    color: '#d97706',
  },
  statusFailed: {
    color: '#dc2626',
  },
  statusDefault: {
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  quickAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    margin: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  paymentMethodsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  paymentMethodsContainer: {
    marginBottom: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentMethodDetails: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  popularBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '500',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  processingButton: {
    opacity: 0.7,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});