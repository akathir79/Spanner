/**
 * SPANNER Mobile App - OTP Verification Screen
 * Verifies OTP with existing SPANNER backend
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface OTPVerificationScreenProps {
  route: {
    params: {
      mobile: string;
    };
  };
  navigation: any;
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ 
  route, 
  navigation 
}) => {
  const { mobile } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { verifyOTP, login } = useAuth();

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      await verifyOTP(mobile, otp);
      
      // Navigation will be handled by AuthContext after successful verification
      // The app will automatically redirect to the main screens
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      await login(mobile);
      
      // Reset countdown
      setCountdown(60);
      setCanResend(false);
      setOtp('');
      
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMobileNumber = (mobile: string) => {
    return `+91 ${mobile.substring(0, 5)} ${mobile.substring(5)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={styles.mobileNumber}>{formatMobileNumber(mobile)}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Enter OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="000000"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          editable={!isLoading}
          autoFocus={true}
          textAlign="center"
          fontSize={24}
          letterSpacing={4}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdownText}>
              Resend OTP in {countdown}s
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.changeNumberText}>Change mobile number</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  mobileNumber: {
    fontWeight: '600',
    color: '#374151',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  changeNumberText: {
    fontSize: 16,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});