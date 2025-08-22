/**
 * SPANNER Mobile App - Login Screen
 * Connects to existing SPANNER backend authentication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'worker' | null>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!mobile.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    // Validate mobile number format (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setIsLoading(true);
      await login(mobile);
      
      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', { mobile });
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SPANNER</Text>
        <Text style={styles.subtitle}>India's Blue-Collar Service Marketplace</Text>
        <Text style={styles.tagline}>Sign up now and get 500 🪙 SPANNER coins!</Text>
      </View>

      <View style={styles.form}>
        {/* Role Selection - Collapsible like web app */}
        <Text style={styles.roleTitle}>I am a</Text>
        {!selectedRole ? (
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => setSelectedRole('client')}
            >
              <Text style={styles.roleIcon}>👤</Text>
              <Text style={styles.roleText}>Client</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => setSelectedRole('worker')}
            >
              <Text style={styles.roleIcon}>🔧</Text>
              <Text style={styles.roleText}>Worker</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selectedRoleContainer}>
            <View style={styles.selectedRole}>
              <Text style={styles.selectedRoleIcon}>
                {selectedRole === 'client' ? '👤' : '🔧'}
              </Text>
              <Text style={styles.selectedRoleText}>{selectedRole}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedRole(null)}>
              <Text style={styles.changeRole}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Login Form - shown after role selection */}
        {selectedRole && (
          <View style={styles.loginForm}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="numeric"
                maxLength={10}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Toggle Links */}
            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Password login will be available soon')}>
                <Text style={styles.linkText}>Use Password</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Email login will be available soon')}>
                <Text style={styles.linkText}>Login with Email</Text>
              </TouchableOpacity>
            </View>

            {/* Google Login */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.googleButton}
              onPress={() => Alert.alert('Coming Soon', 'Google login will be available soon')}
            >
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <Text style={styles.infoText}>
              By logging or signing up, you agree to our Terms & Policy
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  selectedRole: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedRoleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  selectedRoleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d4ed8',
    textTransform: 'capitalize',
  },
  changeRole: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  loginForm: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  button: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  linkText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#6b7280',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 24,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#374151',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});