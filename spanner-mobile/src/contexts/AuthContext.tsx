/**
 * SPANNER Mobile App - Authentication Context
 * Manages user authentication state and connects to existing backend
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
// AsyncStorage will be imported when actually running on device/simulator
// For now, we'll create a mock implementation for development
interface AsyncStorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

// Mock AsyncStorage for development
const mockAsyncStorage: AsyncStorageInterface = {
  getItem: async (key: string) => {
    console.log(`AsyncStorage.getItem(${key})`);
    return null;
  },
  setItem: async (key: string, value: string) => {
    console.log(`AsyncStorage.setItem(${key}, ${value})`);
  },
  removeItem: async (key: string) => {
    console.log(`AsyncStorage.removeItem(${key})`);
  },
  clear: async () => {
    console.log('AsyncStorage.clear()');
  },
};

const AsyncStorage = mockAsyncStorage;
import { apiClient } from '../services/apiClient';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored authentication on app startup
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('spanner_user');
      const storedToken = await AsyncStorage.getItem('spanner_token');
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        apiClient.setAuthToken(storedToken);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (mobile: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(mobile);
      
      if (response.success) {
        // OTP sent successfully - no user data yet
        // The actual login happens in verifyOTP
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (mobile: string, otp: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiClient.verifyOTP(mobile, otp);
      
      if (response.success && response.user) {
        // Store user data and token
        await AsyncStorage.setItem('spanner_user', JSON.stringify(response.user));
        
        // Note: Your backend should return a token, adjust accordingly
        const token = response.token || 'dummy_token_for_session';
        await AsyncStorage.setItem('spanner_token', token);
        
        apiClient.setAuthToken(token);
        setUser(response.user);
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Call backend logout
      await apiClient.logout();
      
      // Clear local storage
      await AsyncStorage.removeItem('spanner_user');
      await AsyncStorage.removeItem('spanner_token');
      
      // Clear API client token
      apiClient.clearAuthToken();
      
      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if backend call fails
      await AsyncStorage.clear();
      apiClient.clearAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    verifyOTP,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};