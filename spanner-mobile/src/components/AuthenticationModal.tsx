import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthenticationModalProps {
  visible: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onSuccess: (user: any) => void;
}

const AuthenticationModal: React.FC<AuthenticationModalProps> = ({
  visible,
  onClose,
  defaultMode = 'login',
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(defaultMode);
  const [userType, setUserType] = useState<'client' | 'worker'>('client');
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email' | 'password'>('mobile');
  
  // Form fields
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Additional signup fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const resetForm = () => {
    setMobile('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setFirstName('');
    setLastName('');
    setOtpSent(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    setMode(defaultMode);
    setUserType('client');
    setAuthMethod('mobile');
    onClose();
  };

  const validateMobile = (mobile: string) => {
    return /^[6-9]\d{9}$/.test(mobile);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOTP = async () => {
    if (authMethod === 'mobile' && !validateMobile(mobile)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (authMethod === 'email' && !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOtpSent(true);
      Alert.alert('OTP Sent', `Verification code sent to your ${authMethod}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = {
        id: '1',
        firstName,
        lastName,
        mobile: authMethod === 'mobile' ? mobile : '',
        email: authMethod === 'email' ? email : '',
        userType
      };
      onSuccess(mockUser);
      Alert.alert('Success', `${mode === 'login' ? 'Logged in' : 'Account created'} successfully!`);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (authMethod === 'mobile' && !validateMobile(mobile)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (authMethod === 'email' && !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      Alert.alert('Password Required', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = {
        id: '1',
        firstName: 'User',
        lastName: 'Name',
        mobile: authMethod === 'mobile' ? mobile : '',
        email: authMethod === 'email' ? email : '',
        userType
      };
      onSuccess(mockUser);
      Alert.alert('Login Successful', 'Welcome back to SPANNER!');
      handleClose();
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Missing Information', 'Please enter your first and last name');
      return;
    }

    if (authMethod === 'mobile' && !validateMobile(mobile)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (authMethod === 'email' && !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (authMethod === 'password' && password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (authMethod === 'password' && password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUser = {
        id: '1',
        firstName,
        lastName,
        mobile: authMethod === 'mobile' ? mobile : '',
        email: authMethod === 'email' ? email : '',
        userType
      };
      onSuccess(mockUser);
      Alert.alert('Account Created', 'Welcome to SPANNER!');
      handleClose();
    } catch (error) {
      Alert.alert('Signup Failed', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    Alert.alert('Coming Soon', 'Google authentication will be available soon');
  };

  const renderContent = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.title}>
              {mode === 'login' ? 'Login to SPANNER' : 
               mode === 'signup' ? 'Join SPANNER' : 
               'Reset Password'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* User Type Selection */}
        {mode !== 'forgot' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Login As</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => setUserType('client')}
              >
                <View style={[styles.radio, userType === 'client' && styles.radioActive]} />
                <Text style={styles.radioLabel}>Client (Need Services)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => setUserType('worker')}
              >
                <View style={[styles.radio, userType === 'worker' && styles.radioActive]} />
                <Text style={styles.radioLabel}>Worker (Provide Services)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Authentication Method Tabs */}
        {mode !== 'forgot' && (
          <View style={styles.section}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, authMethod === 'mobile' && styles.tabActive]}
                onPress={() => setAuthMethod('mobile')}
              >
                <Ionicons name="phone-portrait" size={16} color={authMethod === 'mobile' ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.tabText, authMethod === 'mobile' && styles.tabTextActive]}>Mobile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, authMethod === 'email' && styles.tabActive]}
                onPress={() => setAuthMethod('email')}
              >
                <Ionicons name="mail" size={16} color={authMethod === 'email' ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.tabText, authMethod === 'email' && styles.tabTextActive]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, authMethod === 'password' && styles.tabActive]}
                onPress={() => setAuthMethod('password')}
              >
                <Ionicons name="lock-closed" size={16} color={authMethod === 'password' ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.tabText, authMethod === 'password' && styles.tabTextActive]}>Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {mode === 'forgot' ? 'Enter your details to reset password' : 'Mobile Number / Email'}
          </Text>
          
          {/* Name fields for signup */}
          {mode === 'signup' && (
            <View style={styles.nameContainer}>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.nameField}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          )}

          {/* Mobile/Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {authMethod === 'mobile' ? 'Mobile Number' : 'Email Address'}
            </Text>
            {authMethod === 'mobile' ? (
              <View style={styles.phoneContainer}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="Mobile number"
                  value={mobile}
                  onChangeText={(text) => setMobile(text.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          </View>

          {/* Password field */}
          {authMethod === 'password' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Confirm Password for signup */}
          {mode === 'signup' && authMethod === 'password' && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          )}

          {/* OTP field */}
          {(authMethod !== 'password' && otpSent) && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="Enter 6-digit code"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
              />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {/* Primary Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={() => {
              if (mode === 'forgot') {
                if (otpSent) {
                  handleVerifyOTP();
                } else {
                  handleSendOTP();
                }
              } else if (mode === 'signup') {
                if (authMethod === 'password') {
                  handleSignup();
                } else {
                  if (otpSent) {
                    handleVerifyOTP();
                  } else {
                    handleSendOTP();
                  }
                }
              } else { // login
                if (authMethod === 'password') {
                  handlePasswordAuth();
                } else {
                  if (otpSent) {
                    handleVerifyOTP();
                  } else {
                    handleSendOTP();
                  }
                }
              }
            }}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Processing...' : 
               mode === 'forgot' ? (otpSent ? 'Reset Password' : 'Send Reset Code') :
               mode === 'signup' ? (authMethod === 'password' ? 'Create Account' : (otpSent ? 'Create Account' : 'Send OTP')) :
               authMethod === 'password' ? 'Login' : (otpSent ? 'Verify OTP' : 'Send OTP')}
            </Text>
          </TouchableOpacity>

          {/* Google Sign In */}
          {mode !== 'forgot' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleAuth}
              >
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          {mode === 'login' && (
            <View style={styles.footerLinks}>
              <TouchableOpacity
                onPress={() => { setMode('signup'); resetForm(); }}
              >
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setMode('forgot'); resetForm(); }}
              >
                <Text style={styles.linkText}>Forgot ID/Password</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'signup' && (
            <View style={styles.footerCenter}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => { setMode('login'); resetForm(); }}
              >
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'forgot' && (
            <View style={styles.footerCenter}>
              <TouchableOpacity
                onPress={() => { setMode('login'); resetForm(); }}
              >
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.termsText}>
            By continuing, you agree to SPANNER's{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  radioActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
    marginHorizontal: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
  },
  countryCode: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    borderRightWidth: 0,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeButton: {
    padding: 10,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  footerCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
});

export default AuthenticationModal;