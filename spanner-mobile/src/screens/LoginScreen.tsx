import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ImageBackground,
  Dimensions 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AuthenticationModal from '../components/AuthenticationModal';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const handleAuthSuccess = (user: any) => {
    // Store user data in AsyncStorage or context
    console.log('User authenticated:', user);
    navigation.navigate('Dashboard');
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalVisible(true);
  };

  const openSignupModal = () => {
    setAuthModalMode('signup');
    setAuthModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800' }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>S</Text>
                </View>
                <Text style={styles.brandName}>SPANNER</Text>
              </View>
              <Text style={styles.tagline}>Tamil Nadu Blue-Collar Service Marketplace</Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              <Text style={styles.title}>Find Trusted{'\n'}Blue-Collar Services</Text>
              <Text style={styles.subtitle}>
                Connect with verified professionals across Tamil Nadu. 
                From plumbing to electrical work, find skilled workers near you.
              </Text>

              {/* Features */}
              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.featureTitle}>Verified Workers</Text>
                    <Text style={styles.featureText}>Background checked professionals</Text>
                  </View>
                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="time" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.featureTitle}>Quick Service</Text>
                    <Text style={styles.featureText}>Same-day service available</Text>
                  </View>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="star" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.featureTitle}>Top Rated</Text>
                    <Text style={styles.featureText}>4.8+ average rating</Text>
                  </View>
                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="handshake" size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.featureTitle}>Fair Pricing</Text>
                    <Text style={styles.featureText}>Transparent, honest rates</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={openSignupModal}>
                  <Text style={styles.primaryButtonText}>Get Started Today</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} onPress={openLoginModal}>
                  <Text style={styles.secondaryButtonText}>Login</Text>
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>30,000+</Text>
                  <Text style={styles.statLabel}>Happy Customers</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>5,000+</Text>
                  <Text style={styles.statLabel}>Verified Workers</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>50,000+</Text>
                  <Text style={styles.statLabel}>Jobs Completed</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Authentication Modal */}
      <AuthenticationModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        defaultMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  features: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default LoginScreen;