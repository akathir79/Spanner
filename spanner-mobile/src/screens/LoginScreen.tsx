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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
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

        <Text style={styles.infoText}>
          We'll send an OTP to verify your mobile number
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
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
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
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