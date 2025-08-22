/**
 * SPANNER Mobile App - Profile Screen
 * Unified profile management for all user roles
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

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

  const isFieldRequired = (fieldValue: any): boolean => {
    return fieldValue === "UPDATE_REQUIRED" || fieldValue === "" || fieldValue === null || fieldValue === undefined;
  };

  const renderProfileField = (label: string, value: any, required: boolean = false) => {
    const needsUpdate = isFieldRequired(value);
    const displayValue = needsUpdate ? "UPDATE_REQUIRED" : value || "Not Set";

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[
          styles.fieldValue,
          needsUpdate && styles.fieldValueRequired
        ]}>
          <Text style={[
            styles.fieldText,
            needsUpdate && styles.fieldTextRequired
          ]}>
            {displayValue}
          </Text>
          {needsUpdate && (
            <Ionicons name="warning" size={16} color="#ef4444" style={styles.warningIcon} />
          )}
        </View>
      </View>
    );
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={40} color="#9ca3af" />
            </View>
          )}
          {!user?.profilePicture && (
            <View style={styles.missingBadge}>
              <Ionicons name="warning" size={12} color="#ffffff" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        {renderProfileField("First Name", user?.firstName)}
        {renderProfileField("Last Name", user?.lastName, true)}
        {renderProfileField("Email", user?.email, true)}
        {renderProfileField("Mobile", user?.mobile)}
        {renderProfileField("Role", user?.role)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Information</Text>
        {renderProfileField("House Number", user?.houseNumber, true)}
        {renderProfileField("Street Name", user?.streetName, true)}
        {renderProfileField("Area", user?.areaName, true)}
        {renderProfileField("District", user?.district, true)}
        {renderProfileField("State", user?.state, true)}
        {renderProfileField("PIN Code", user?.pincode, true)}
        {renderProfileField("Full Address", user?.fullAddress, true)}
      </View>

      {user?.role === 'worker' && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Information</Text>
            {renderProfileField("Experience", user?.experience, true)}
            {renderProfileField("Skills", user?.skills, true)}
            {renderProfileField("Service Areas", user?.serviceAreas, true)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            {renderProfileField("Account Number", user?.bankAccountNumber, true)}
            {renderProfileField("IFSC Code", user?.bankIFSC, true)}
            {renderProfileField("Account Holder Name", user?.bankAccountHolderName, true)}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.updateButton}>
        <Ionicons name="create" size={20} color="#ffffff" />
        <Text style={styles.updateButtonText}>Update Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const notificationCount = getNotificationCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
          {notificationCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'profile' ? renderProfileTab() : (
        <View style={styles.tabContent}>
          <Text style={styles.comingSoon}>Settings coming soon...</Text>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  logoutButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fieldValueRequired: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  fieldText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  fieldTextRequired: {
    color: '#ef4444',
  },
  warningIcon: {
    marginLeft: 8,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  comingSoon: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
});