/**
 * SPANNER Mobile App - Tab Navigator
 * Main navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import Wallet from '../../components/Wallet';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  const { user } = useAuth();

  // Get notification count for profile tab
  const getNotificationCount = () => {
    if (!user) return 0;

    let count = 0;

    if (user.role === 'worker') {
      const fieldsToCheck = [
        user.lastName,
        user.email,
        user.houseNumber,
        user.streetName,
        user.areaName,
        user.district,
        user.state,
        user.pincode,
        user.fullAddress,
        user.experience,
        user.skills,
        user.serviceAreas,
        user.bankAccountNumber,
        user.bankIFSC,
        user.bankAccountHolderName
      ];

      fieldsToCheck.forEach(field => {
        if (field === "UPDATE_REQUIRED" || field === "" || field === null || field === undefined) {
          count++;
        }
      });

      if (!user.profilePicture) {
        count++;
      }

    } else if (user.role === 'client') {
      const fieldsToCheck = [
        user.lastName,
        user.email,
        user.houseNumber,
        user.streetName,
        user.areaName,
        user.district,
        user.state,
        user.pincode,
        user.fullAddress
      ];

      fieldsToCheck.forEach(field => {
        if (field === "UPDATE_REQUIRED" || field === "" || field === null || field === undefined) {
          count++;
        }
      });

      if (!user.profilePicture) {
        count++;
      }

    } else if (user.role === 'admin' || user.role === 'super_admin') {
      const fieldsToCheck = [
        user.lastName,
        user.email,
        user.district,
        user.state
      ];

      fieldsToCheck.forEach(field => {
        if (field === "UPDATE_REQUIRED" || field === "" || field === null || field === undefined) {
          count++;
        }
      });
    }

    return count;
  };

  const notificationCount = getNotificationCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      
      {(user?.role === 'client' || user?.role === 'worker' || user?.role === 'admin' || user?.role === 'super_admin') && (
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
      )}
      
      {(user?.role === 'client' || user?.role === 'worker') && (
        <Tab.Screen name="Wallet" component={Wallet} />
      )}
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      />
    </Tab.Navigator>
  );
};