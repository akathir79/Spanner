/**
 * SPANNER Mobile - Quick Post Modal Component
 * Voice-enabled job posting for React Native
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  TextInput,

} from 'react-native';

interface QuickPostModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'auth-check' | 'language' | 'recording' | 'preview' | 'success';

const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' }
];

export default function QuickPostModal({ visible, onClose }: QuickPostModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('language');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const handBounceAnim = useRef(new Animated.Value(0)).current;

  // Timer effect for recording
  useEffect(() => {
    if (isRecording && recordingStartTimeRef.current > 0) {
      console.log('Starting mobile timer effect...');
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        console.log('Mobile timer tick - Recording duration:', elapsed);
        setRecordingDuration(elapsed);
      }, 100);

      return () => {
        console.log('Cleaning up mobile timer effect');
        clearInterval(interval);
      };
    }
  }, [isRecording]);

  // Pulse animation for recording button
  useEffect(() => {
    if (isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isRecording, pulseAnim]);

  // Hand bounce animation for guiding users
  useEffect(() => {
    const handAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(handBounceAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(handBounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    handAnimation.start();
    return () => handAnimation.stop();
  }, [handBounceAnim]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // Auto-proceed to recording and start recording immediately
    setTimeout(() => {
      setCurrentStep('recording');
      setTimeout(() => startRecording(), 1500);
    }, 300);
  };

  const startRecording = async () => {
    try {
      console.log('Starting mobile recording...');
      setIsRecording(true);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();
      
      // Mobile-specific recording implementation would go here
      Alert.alert('Recording Started', 'Voice recording functionality will be implemented with react-native-audio-recorder-player');
      
    } catch (error) {
      console.error('Mobile recording error:', error);
      Alert.alert('Recording Error', 'Please check microphone permissions');
    }
  };

  const stopRecording = () => {
    console.log('Stopping mobile recording...');
    setIsRecording(false);
    // Timer cleanup handled by useEffect
    Alert.alert('Recording Complete', 'Processing your voice message...');
    setCurrentStep('success');
  };

  const resetModal = () => {
    setCurrentStep('language');
    setSelectedLanguage('');
    setIsRecording(false);
    setRecordingDuration(0);
    recordingStartTimeRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎤 Quick Job Post with Voice</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Language Selection Step */}
          {currentStep === 'language' && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepIcon}>🌐</Text>
                <Text style={styles.stepTitle}>Choose your preferred language</Text>
              </View>

              {/* Mobile guidance */}

              


              {/* Language Dropdown Alternative */}
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Select language:</Text>
                <View style={styles.pickerPlaceholder}>
                  <Text style={styles.pickerText}>
                    {selectedLanguage 
                      ? `${supportedLanguages.find(l => l.code === selectedLanguage)?.flag} ${supportedLanguages.find(l => l.code === selectedLanguage)?.name}`
                      : 'Select language'
                    }
                  </Text>
                </View>
              </View>

              {/* Language Buttons */}
              <Text style={styles.orText}>Or tap a language:</Text>
              <View style={styles.languageGrid}>
                {supportedLanguages.slice(0, 6).map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageButton,
                      selectedLanguage === lang.code && styles.languageButtonSelected
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={[
                      styles.languageText,
                      selectedLanguage === lang.code && styles.languageTextSelected
                    ]}>
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedLanguage && (
                <View style={styles.confirmationContainer}>
                  <Text style={styles.confirmationText}>
                    ✓ {supportedLanguages.find(l => l.code === selectedLanguage)?.name} selected
                  </Text>
                  <Text style={styles.confirmationSubtext}>
                    Starting voice recording automatically...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Recording Step */}
          {currentStep === 'recording' && (
            <View style={styles.stepContainer}>
              {isRecording ? (
                <View style={styles.recordingContainer}>
                  <Animated.View style={[styles.recordingCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.recordingIcon}>🔴</Text>
                  </Animated.View>
                  <Text style={styles.recordingTitle}>Recording...</Text>
                  <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
                  <Text style={styles.recordingSubtext}>
                    Speak clearly about your job requirements
                  </Text>
                  <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
                    <Text style={styles.stopButtonText}>🛑 Stop Recording</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.readyContainer}>
                  <Text style={styles.readyIcon}>🎤</Text>
                  <Text style={styles.readyTitle}>Get Ready to Speak!</Text>
                  <Text style={styles.readySubtext}>
                    Recording will start automatically in {supportedLanguages.find(l => l.code === selectedLanguage)?.name}
                  </Text>
                  
                  {/* Mobile recording guidance */}
                  <View style={styles.recordingGuidanceContainer}>
                    <Text style={styles.recordingGuidanceTitle}>🎯 What to include in your recording:</Text>
                    <Text style={styles.recordingGuidanceText}>✓ Service needed: "I need a plumber"</Text>
                    <Text style={styles.recordingGuidanceText}>✓ Problem details: "Kitchen tap is leaking"</Text>
                    <Text style={styles.recordingGuidanceText}>✓ Location: "Anna Nagar, Chennai"</Text>
                    <Text style={styles.recordingGuidanceText}>✓ Budget: "My budget is 2000 rupees"</Text>
                    <Text style={styles.recordingGuidanceText}>✓ Urgency: "Please come today"</Text>
                  </View>
                  
                  <Text style={styles.exampleText}>
                    Example: "I need a plumber to fix my kitchen tap leak in Anna Nagar, Chennai. My budget is 2000 rupees. Please come today."
                  </Text>
                  
                  <View style={styles.autoStartContainer}>
                    <Text style={styles.autoStartText}>⏳ Recording will start in a moment...</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <View style={styles.stepContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Recording Complete!</Text>
              <Text style={styles.successSubtext}>
                Processing your voice message and creating job post...
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  pickerPlaceholder: {
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#374151',
  },
  orText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
    textAlign: 'center',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  languageButton: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  languageButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  languageFlag: {
    fontSize: 20,
    marginBottom: 4,
  },
  languageText: {
    fontSize: 12,
    color: '#374151',
  },
  languageTextSelected: {
    color: '#fff',
  },
  confirmationContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
  },
  confirmationSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  recordingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingIcon: {
    fontSize: 40,
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
  },
  recordingTimer: {
    fontSize: 32,
    fontFamily: 'monospace',
    color: '#1f2937',
    marginBottom: 20,
  },
  recordingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  stopButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  readySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 10,
  },
  exampleText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18,
  },
  startButtonContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  handPointer: {
    position: 'absolute',
    top: -40,
    right: 20,
    zIndex: 10,
  },
  handPointerEmoji: {
    fontSize: 28,
    transform: [{ rotate: '15deg' }],
  },
  guidingTextContainer: {
    position: 'absolute',
    bottom: -35,
    alignSelf: 'center',
  },
  guidingText: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 10,
  },
  successSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Guidance styles
  guidanceContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  guidanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  guidanceText: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 2,
  },
  tipContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  tipText: {
    fontSize: 12,
    color: '#166534',
  },
  recordingGuidanceContainer: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  recordingGuidanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  recordingGuidanceText: {
    fontSize: 11,
    color: '#92400e',
    marginBottom: 3,
  },
  autoStartContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  autoStartText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});