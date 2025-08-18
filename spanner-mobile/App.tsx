/**
 * SPANNER Mobile App - Main App Component
 * Entry point for the React Native mobile application
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { OTPVerificationScreen } from './src/screens/OTPVerificationScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
  </View>
);

// Navigation component that handles auth state
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is logged in - show main app screens
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // User is not logged in - show auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App component
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
