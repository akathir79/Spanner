/**
 * SPANNER Mobile App - Notification Bell Component
 * Displays notification count for missing profile fields across all user roles
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';

interface NotificationBellProps {
  onPress?: () => void;
  size?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  onPress,
  size = 24 
}) => {
  const { user } = useAuth();

  const getNotificationCount = () => {
    if (!user) return 0;

    let count = 0;

    if (user.role === 'worker') {
      // Worker-specific required fields
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

      // Add profile picture if missing
      if (!user.profilePicture) {
        count++;
      }

    } else if (user.role === 'client') {
      // Client-specific required fields
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

      // Add profile picture if missing
      if (!user.profilePicture) {
        count++;
      }

    } else if (user.role === 'admin' || user.role === 'super_admin') {
      // Admin-specific required fields
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
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons
        name="notifications-outline"
        size={size}
        color="#374151"
      />
      {notificationCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {notificationCount > 99 ? '99+' : notificationCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});