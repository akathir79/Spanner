/**
 * SPANNER Mobile App - Dashboard Screen
 * Role-based dashboard for clients, workers, and admins
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from '../../components/NotificationBell';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    earnings: 0,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Add API calls to refresh data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderClientDashboard = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.statValue}>{stats.completedBookings}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Post New Job</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Ionicons name="search" size={24} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Browse Services</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderWorkerDashboard = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="wallet" size={24} color="#10b981" />
          <Text style={styles.statValue}>₹{stats.earnings}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="briefcase" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>4.5</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="search" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Find Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Ionicons name="person" size={24} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderAdminDashboard = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Admin Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>1,234</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="business" size={24} color="#10b981" />
          <Text style={styles.statValue}>567</Text>
          <Text style={styles.statLabel}>Active Workers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>89</Text>
          <Text style={styles.statLabel}>Pending Verifications</Text>
        </View>
      </View>

      {/* Management Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="megaphone" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Manage Advertisements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Ionicons name="chatbubbles" size={24} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Support Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Ionicons name="cash" size={24} color="#3b82f6" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Financial Management</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'client':
        return renderClientDashboard();
      case 'worker':
        return renderWorkerDashboard();
      case 'admin':
      case 'super_admin':
        return renderAdminDashboard();
      default:
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Dashboard not available for this role</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {user?.role === 'super_admin' ? 'Super Admin Dashboard' : 
             user?.role === 'admin' ? 'Admin Dashboard' :
             user?.role === 'worker' ? 'Worker Dashboard' : 'Client Dashboard'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user?.firstName}!
          </Text>
        </View>
        <NotificationBell 
          onPress={() => navigation.navigate('Profile')}
          size={28}
        />
      </View>

      {getDashboardContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
});