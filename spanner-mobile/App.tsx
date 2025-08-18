/**
 * SPANNER Mobile App - Main App Component
 * Entry point for the React Native mobile application
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Simple App component for now - will add navigation after dependencies are installed
export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState('home');

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
                onPress={() => setCurrentScreen('login')}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setCurrentScreen('register')}
              >
                <Text style={styles.secondaryButtonText}>Register</Text>
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
              onPress={() => setCurrentScreen('home')}
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
              onPress={() => setCurrentScreen('home')}
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
          Backend: {__DEV__ ? 'localhost:5000' : 'production'}
        </Text>
      </View>
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
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
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
});
