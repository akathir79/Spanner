/**
 * SPANNER Mobile App - Home Screen
 * Main dashboard for clients and workers
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { ServiceCategory, Booking } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setIsLoading(true);
      
      // Load services
      const servicesResponse = await apiClient.getServices();
      if (servicesResponse.data) {
        setServices(servicesResponse.data.slice(0, 6)); // Show first 6 services
      }

      // Load recent bookings based on user role
      if (user?.role === 'client') {
        const bookingsResponse = await apiClient.getClientBookings();
        if (bookingsResponse.data) {
          setRecentBookings(bookingsResponse.data.slice(0, 3)); // Show recent 3
        }
      } else if (user?.role === 'worker') {
        const bookingsResponse = await apiClient.getWorkerBookings();
        if (bookingsResponse.data) {
          setRecentBookings(bookingsResponse.data.slice(0, 3)); // Show recent 3
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBasedContent = () => {
    if (user?.role === 'client') {
      return {
        mainAction: 'Post a Job',
        mainActionIcon: '📝',
        onMainAction: () => navigation.navigate('CreateJob'),
        secondaryAction: 'Browse Services',
        onSecondaryAction: () => navigation.navigate('Services'),
      };
    } else if (user?.role === 'worker') {
      return {
        mainAction: 'Find Jobs',
        mainActionIcon: '🔍',
        onMainAction: () => navigation.navigate('Jobs'),
        secondaryAction: 'Update Profile',
        onSecondaryAction: () => navigation.navigate('WorkerProfile'),
      };
    }
    return {
      mainAction: 'Explore',
      mainActionIcon: '🏠',
      onMainAction: () => {},
      secondaryAction: 'Settings',
      onSecondaryAction: () => {},
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const roleContent = getRoleBasedContent();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={roleContent.onMainAction}
        >
          <Text style={styles.actionIcon}>{roleContent.mainActionIcon}</Text>
          <Text style={styles.primaryActionText}>{roleContent.mainAction}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryAction}
          onPress={roleContent.onSecondaryAction}
        >
          <Text style={styles.secondaryActionText}>{roleContent.secondaryAction}</Text>
        </TouchableOpacity>
      </View>

      {/* Services Section */}
      {services.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id} 
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServiceDetails', { serviceId: service.id })}
              >
                <Text style={styles.serviceIcon}>🔧</Text>
                <Text style={styles.serviceName}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentBookings.map((booking) => (
            <TouchableOpacity 
              key={booking.id} 
              style={styles.bookingCard}
              onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
            >
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>{booking.title}</Text>
                <Text style={styles.bookingStatus}>{booking.status}</Text>
              </View>
              <Text style={styles.bookingAmount}>₹{booking.amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Stats Section for Workers */}
      {user?.role === 'worker' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Active Jobs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    padding: 24,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionIcon: {
    fontSize: 24,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  sectionLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '31%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  bookingStatus: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});