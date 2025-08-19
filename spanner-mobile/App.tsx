/**
 * SPANNER Mobile App - Main App Component
 * Entry point for the React Native mobile application
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import QuickPostModal from './components/QuickPostModal';

// Simple App component - stable version for mobile testing
export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState('home');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [showQuickPost, setShowQuickPost] = React.useState(false);

  React.useEffect(() => {
    // Simple app initialization
    try {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
    } catch (error) {
      console.log('App initialization error:', error);
      setIsLoaded(true); // Still show app even if error
    }
  }, []);

  const handleButtonPress = (screen: string) => {
    try {
      if (screen === 'test') {
        Alert.alert('SPANNER Mobile', 'App is working correctly!');
      } else if (screen === 'quick-post') {
        setShowQuickPost(true);
      } else {
        setCurrentScreen(screen);
      }
    } catch (error) {
      console.log('Button press error:', error);
    }
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <Text style={styles.loadingText}>Loading SPANNER...</Text>
        <Text style={styles.loadingSubtext}>Getting ready...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🔧 SPANNER</Text>
        <Text style={styles.subtitle}>Mobile App</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {currentScreen === 'home' && (
          <View style={styles.screenContainer}>
            <Text style={styles.title}>Welcome to SPANNER Mobile!</Text>
            <Text style={styles.description}>
              Your blue-collar service marketplace is now available on mobile.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={() => handleButtonPress('test')}
              >
                <Text style={styles.buttonText}>Test App</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => handleButtonPress('login')}
              >
                <Text style={styles.secondaryButtonText}>Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => handleButtonPress('register')}
              >
                <Text style={styles.secondaryButtonText}>Register</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.voiceButton]}
                onPress={() => handleButtonPress('quick-post')}
              >
                <Text style={styles.voiceButtonText}>🎤 Quick Job Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentScreen === 'login' && (
          <View style={styles.screenContainer}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.description}>
              Enter your mobile number to get started
            </Text>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => handleButtonPress('home')}
            >
              <Text style={styles.secondaryButtonText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentScreen === 'register' && (
          <View style={styles.screenContainer}>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.description}>
              Create your SPANNER account
            </Text>
            
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => handleButtonPress('home')}
            >
              <Text style={styles.secondaryButtonText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Connecting to SPANNER backend...
        </Text>
        <Text style={styles.footerSubtext}>
          Status: Connected to Metro
        </Text>
      </View>

      {/* Quick Post Modal */}
      <QuickPostModal 
        visible={showQuickPost} 
        onClose={() => setShowQuickPost(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceButton: {
    backgroundColor: '#16a34a',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#6b7280',
  },
});
