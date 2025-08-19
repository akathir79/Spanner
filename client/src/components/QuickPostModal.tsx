import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, Loader2, Globe, Square } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface QuickPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickPostModal({ isOpen, onClose }: QuickPostModalProps) {
  const { user, loginWithOtp, verifyOtp, signupClient } = useAuth();
  const { toast } = useToast();

  // Language names mapping
  const languageNames: Record<string, string> = {
    'en': 'English',
    'hi': 'Hindi (हिंदी)',
    'ta': 'Tamil (தமிழ்)',
    'te': 'Telugu (తెలుగు)',
    'bn': 'Bengali (বাংলা)',
    'ml': 'Malayalam (മലയാളം)',
    'kn': 'Kannada (ಕನ್ನಡ)',
    'gu': 'Gujarati (ગુજરાતી)',
    'mr': 'Marathi (मराठी)',
    'pa': 'Punjabi (ਪੰਜਾਬੀ)'
  };

  // Simple state management
  const [currentStep, setCurrentStep] = useState<'auth-check' | 'role-restriction' | 'login' | 'register' | 'language' | 'recording' | 'preview' | 'manual-input' | 'success' | 'location-confirmation'>('auth-check');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingStartTimeRef = useRef<number>(0);
  const [processedResult, setProcessedResult] = useState<any>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [manualJobData, setManualJobData] = useState({
    title: '',
    description: '',
    budget: { min: 1000, max: 5000 },
    location: '',
    urgency: 'medium' as const
  });
  
  // Quick auth states - simplified to match Quick Join flow
  const [quickAuthData, setQuickAuthData] = useState({
    mobile: '',
    firstName: '',
    role: 'client' as 'client' | 'worker'
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  // Mobile availability checking state - for both login and registration flows
  const [mobileAvailability, setMobileAvailability] = useState<"checking" | "available" | "not-available" | "">("");
  const [isLoginFlow, setIsLoginFlow] = useState(false); // Track if we're in login or registration flow
  
  // Location confirmation states
  const [extractedData, setExtractedData] = useState<any>(null);
  const [processedTranscription, setProcessedTranscription] = useState('');
  const [originalTranscription, setOriginalTranscription] = useState('');
  const [locationData, setLocationData] = useState({
    area: '',
    district: '',
    state: '',
    fullAddress: '',
    budgetMin: '',
    budgetMax: ''
  });

  const [customLocationData, setCustomLocationData] = useState({
    houseNumber: '',
    streetName: '',
    areaName: '',
    district: '',
    state: '',
    pincode: '',
    currentLocationUsed: false,
    profileAddressUsed: false,
  });

  // Mobile availability checking function
  const checkMobileAvailability = useCallback(async (mobile: string) => {
    try {
      const response = await fetch("/api/auth/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, email: "", aadhaarNumber: "", role: "client" }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setMobileAvailability(result.mobile ? "available" : "not-available");
      }
    } catch (error) {
      console.error("Error checking mobile availability:", error);
      setMobileAvailability("");
    }
  }, []);

  const [showCustomLocationForm, setShowCustomLocationForm] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Language support
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

  // Check authentication status when modal opens
  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Check if user is a client - only clients can post jobs
        if (user.role === 'client') {
          // User is logged in as client, pre-fill location from profile and go to language selection
          setLocationData(prev => ({
            ...prev,
            area: user.areaName || prev.area,
            district: user.district || prev.district,
            state: user.state || prev.state,
            fullAddress: user.fullAddress || prev.fullAddress
          }));
          setCurrentStep('language');
        } else {
          // User is logged in but not as client (worker role) - show role restriction
          setCurrentStep('role-restriction');
        }
      } else {
        // User not logged in, start with auth check
        setCurrentStep('auth-check');
      }
      setSelectedLanguage(''); // Default to empty for placeholder
      setIsRecording(false);
      setIsProcessing(false);
      setRecordingDuration(0);
      setOtpSent(false);
      recordingStartTimeRef.current = 0;
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setOtp('');
      setQuickAuthData({
        mobile: '',
        firstName: '',
        role: 'client'
      });
      setMobileAvailability('');
      setIsLoginFlow(false);
    }
  }, [isOpen, user]);

  // Watch for mobile number changes and check availability
  useEffect(() => {
    if (quickAuthData.mobile && quickAuthData.mobile.length >= 10) {
      setMobileAvailability("checking");
      const timer = setTimeout(() => {
        checkMobileAvailability(quickAuthData.mobile);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setMobileAvailability("");
    }
  }, [quickAuthData.mobile, checkMobileAvailability]);

  // Timer effect - runs when recording starts
  useEffect(() => {
    if (isRecording && recordingStartTimeRef.current > 0) {
      console.log("Starting timer effect...");
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        console.log("Timer tick - Recording duration:", elapsed);
        setRecordingDuration(elapsed);
      }, 100);

      return () => {
        console.log("Cleaning up timer effect");
        clearInterval(interval);
      };
    }
  }, [isRecording]);

  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      // Check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Browser Not Supported",
          description: "Your browser doesn't support voice recording. Please use Chrome, Edge, or Safari.",
          variant: "destructive"
        });
        return;
      }

      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      console.log("Microphone access granted, creating MediaRecorder...");
      
      // Check MediaRecorder support and pick best format
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        console.log("webm not supported, trying webm;codecs=opus");
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          console.log("Using mp4");
          mimeType = 'audio/mp4';
        } else {
          console.log("Using default mime type");
          mimeType = '';
        }
      }
      
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      
      console.log("MediaRecorder created with mimeType:", mediaRecorder.mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available, size:", event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, creating blob...");
        
        // Timer cleanup will be handled by useEffect
        console.log("Recording stopped, timer will cleanup via useEffect");
        
        // Set final duration based on actual elapsed time
        if (recordingStartTimeRef.current > 0) {
          const finalDuration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingDuration(finalDuration);
          console.log("Final recording duration:", finalDuration);
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        console.log("Audio blob size:", audioBlob.size);
        
        // Store the recorded audio for playback
        setRecordedAudio(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        stream.getTracks().forEach(track => track.stop());
        
        // Transition to preview step instead of auto-processing
        setTimeout(() => {
          setCurrentStep('preview');
        }, 500);
      };

      mediaRecorder.onstart = () => {
        console.log("Recording started successfully - onstart event fired");
        // State already set above for immediate response
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording Error",
          description: "Failed to record audio. Please try again.",
          variant: "destructive"
        });
      };

      console.log("Starting recording...");
      
      // Clear any existing timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Start recording immediately and set state
      setIsRecording(true);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();
      
      // Start MediaRecorder first
      mediaRecorder.start(1000); // Record in 1-second chunks
      
      // Timer will be handled by useEffect hook
      console.log("Recording started, timer should start via useEffect");

    } catch (error: any) {
      console.error("Recording setup error:", error);
      let errorMessage = "Please allow microphone access to use voice recording.";
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = "Microphone access denied. Please allow microphone permission and try again.";
      } else if (error?.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      } else if (error?.name === 'NotSupportedError') {
        errorMessage = "Your browser doesn't support voice recording. Please use Chrome, Edge, or Safari.";
      }

      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    console.log("Stop recording called, isRecording:", isRecording);
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Timer cleanup will be handled by useEffect
    }
  }, [isRecording]);

  // Confirm job posting with location
  const confirmJobPosting = useCallback(async () => {
    setIsProcessing(true);
    try {
      const currentUser = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
      
      const response = await fetch('/api/voice/confirm-job-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          extractedData,
          transcription: processedTranscription,
          locationData: {
            ...locationData,
            budgetMin: parseInt(locationData.budgetMin) || extractedData?.budget?.min || 1000,
            budgetMax: parseInt(locationData.budgetMax) || extractedData?.budget?.max || 5000
          },
          customLocationData: showCustomLocationForm ? customLocationData : null
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Job Posted Successfully!",
          description: `Your job "${result.jobPost.title}" has been created and is now live.`
        });
        onClose();
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to create job posting');
      }
    } catch (error: any) {
      console.error("Job confirmation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job posting",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [extractedData, processedTranscription, locationData, customLocationData, showCustomLocationForm, user, toast, onClose]);

  // Process recording function
  const processRecording = useCallback(async (audioBlob: Blob) => {
    console.log("Processing recording, blob size:", audioBlob.size);
    setIsProcessing(true);
    
    if (audioBlob.size === 0) {
      toast({
        title: "Recording Failed",
        description: "No audio was recorded. Please try again and speak into your microphone.",
        variant: "destructive"
      });
      setIsProcessing(false);
      setCurrentStep('recording');
      return;
    }
    
    try {
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...Array.from(new Uint8Array(arrayBuffer))));
      
      // Get current user (check localStorage if useAuth hasn't updated yet)
      const storedUser = localStorage.getItem('user');
      const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
      
      console.log("Sending voice data to server:", {
        audioSize: base64Audio.length,
        mimeType: audioBlob.type,
        language: selectedLanguage,
        userId: currentUser?.id,
        userObject: currentUser
      });

      // Send to server for Gemini processing
      const response = await fetch('/api/voice/process-job-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioBlob.type,
          language: selectedLanguage,
          userId: currentUser?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.requiresLocationConfirmation) {
        // Voice processed but needs location confirmation
        console.log("Voice processing result:", {
          transcription: result.transcription,
          originalText: result.originalText,
          extractedData: result.extractedData,
          requiresLocationConfirmation: result.requiresLocationConfirmation
        });
        
        console.log("Setting transcriptions:", {
          processedTranscription: result.transcription,
          originalTranscription: result.originalText
        });
        
        setExtractedData(result.extractedData);
        setProcessedTranscription(result.transcription); // English translation
        setOriginalTranscription(result.originalText || result.transcription); // Original language
        
        // Initialize location data with extracted or user profile data
        const extractedLoc = result.extractedData?.location;
        setLocationData({
          area: extractedLoc?.area || user?.areaName || '',
          district: extractedLoc?.district || user?.district || '',
          state: extractedLoc?.state || user?.state || '',
          budgetMin: result.extractedData?.budget?.min?.toString() || '',
          budgetMax: result.extractedData?.budget?.max?.toString() || '',
          fullAddress: extractedLoc?.fullAddress || user?.fullAddress || ''
        });
        
        setCurrentStep('location-confirmation');
      } else if (result.success && result.jobPost) {
        // Job posting created successfully
        setProcessedResult(result);
        toast({
          title: "Job Posted Successfully!",
          description: `Your job "${result.jobPost.title}" has been created and is now live.`
        });
        setCurrentStep('success');
      } else if (result.fallbackMode) {
        // Voice processing failed, show manual input form
        setCurrentStep('manual-input');
        toast({
          title: "Voice Processing Unavailable",
          description: "Please fill in the job details manually.",
          variant: "destructive"
        });
      } else {
        throw new Error(result.message || 'Failed to process voice recording');
      }
      
    } catch (error: any) {
      console.error("Voice processing error:", error);
      
      // Check if it's a server error - fallback to manual input
      if (error.message.includes("Server error: 500")) {
        setCurrentStep('manual-input');
        toast({
          title: "Voice Processing Unavailable",
          description: "Please fill in the job details manually.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Processing Failed",
          description: error.message || "Failed to process your voice recording. Please try again.",
          variant: "destructive"
        });
        setCurrentStep('recording');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [toast, selectedLanguage, user]);

  // Handle manual job submission
  const handleManualSubmit = useCallback(async () => {
    if (!manualJobData.title || !manualJobData.description || !manualJobData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (title, description, location)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const storedUser = localStorage.getItem('user');
      const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
      
      if (!currentUser?.id) {
        throw new Error("User authentication required");
      }

      const jobPostData = {
        title: manualJobData.title,
        description: manualJobData.description,
        serviceCategory: "General Services", // Default category
        location: manualJobData.location,
        budget: manualJobData.budget,
        urgency: manualJobData.urgency,
        userId: currentUser.id,
        isManualEntry: true
      };

      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobPostData)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Format result to match voice processing response format
        const formattedResult = {
          success: true,
          jobPost: result.jobPost,
          transcription: audioUrl ? "Job created from voice recording (processed manually)" : null,
          extractedData: {
            confidence: 1.0,
            manualEntry: true
          }
        };
        
        setProcessedResult(formattedResult);
        setCurrentStep('success');
        
        toast({
          title: "Job Posted Successfully!",
          description: `Your job "${result.jobPost.title}" has been created and is now live.`
        });
      } else {
        throw new Error(result.message || 'Failed to create job posting');
      }

    } catch (error: any) {
      console.error("Manual job submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to create job posting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [manualJobData, user, toast, audioUrl]);

  // Quick authentication functions
  const handleSendOtp = useCallback(async () => {
    if (!quickAuthData.mobile || quickAuthData.mobile.length < 10) {
      toast({
        title: "Invalid Mobile",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await loginWithOtp(quickAuthData.mobile, quickAuthData.role);
      if (result.success) {
        setOtpSent(true);
        setGeneratedOtp(result.otp || '');
        toast({
          title: "OTP Sent",
          description: `OTP sent to ${quickAuthData.mobile}. Development OTP: ${result.otp || '123456'}`,
        });
      } else {
        throw new Error(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [quickAuthData, loginWithOtp, toast]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await verifyOtp(quickAuthData.mobile, otp, 'login');
      if (result) {
        toast({
          title: "Login Successful",
          description: `Welcome ${result.firstName}!`
        });
        setCurrentStep('language');
      } else {
        throw new Error('Invalid OTP or failed to login');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [otp, quickAuthData.mobile, verifyOtp, toast]);

  const handleQuickRegister = useCallback(async () => {
    if (!quickAuthData.firstName || !quickAuthData.mobile) {
      toast({
        title: "Missing Information",
        description: "Please fill in your first name and mobile number",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Use simplified registration with only first name and mobile
      const endpoint = quickAuthData.role === "client" ? "/api/auth/signup/client" : "/api/auth/signup/worker";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: quickAuthData.firstName,
          mobile: quickAuthData.mobile,
          role: quickAuthData.role,
          lastName: "UPDATE_REQUIRED", // Mark for update
          // Address will be collected during job posting
          houseNumber: "COLLECT_DURING_POSTING",
          streetName: "COLLECT_DURING_POSTING", 
          areaName: "COLLECT_DURING_POSTING",
          district: "COLLECT_DURING_POSTING",
          state: "COLLECT_DURING_POSTING",
          pincode: "COLLECT_DURING_POSTING",
          email: "", // Will be requested in dashboard
          fullAddress: "COLLECT_DURING_POSTING",
          // Quick Post is only for clients - no worker-specific fields needed
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Registration failed";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      
      if (result.success && result.user) {
        toast({
          title: "Registration Successful",
          description: `Welcome ${result.user.firstName}! You can now post jobs. Your address will be collected during your first job posting.`
        });
        setCurrentStep('language');
      } else {
        throw new Error(result.error || 'Failed to create account');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [quickAuthData, signupClient, toast]);

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            Quick Job Post with Voice
          </DialogTitle>
        </DialogHeader>

        {/* Authentication Check Step */}
        {currentStep === 'auth-check' && (
          <div className="text-center space-y-4">
            <div className="text-6xl">🔐</div>
            <h3 className="text-xl font-semibold">Quick Post Authentication</h3>
            <p className="text-muted-foreground">
              To post a job and hire workers using voice, you need to be logged in.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => {
                setIsLoginFlow(true);
                setCurrentStep('login');
              }} className="w-full">
                I Have an Account
              </Button>
              <Button onClick={() => {
                setIsLoginFlow(false);
                setCurrentStep('register');
              }} variant="outline" className="w-full">
                Create New Account
              </Button>
            </div>
          </div>
        )}

        {/* Quick Login Step */}
        {currentStep === 'login' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold">Quick Login</h3>
              <p className="text-muted-foreground">Enter your mobile number to login</p>
            </div>
            
            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mobile Number</label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={quickAuthData.mobile}
                      onChange={(e) => setQuickAuthData(prev => ({ ...prev, mobile: e.target.value }))}
                      maxLength={10}
                      className={
                        isLoginFlow 
                          ? (mobileAvailability === "available" ? "border-red-500" : "") 
                          : (mobileAvailability === "not-available" ? "border-red-500" : "")
                      }
                    />
                    {mobileAvailability === "checking" && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {/* Show checkmark based on login vs registration flow */}
                    {mobileAvailability === "available" && !isLoginFlow && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                        ✓
                      </div>
                    )}
                    {mobileAvailability === "not-available" && isLoginFlow && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                        ✓
                      </div>
                    )}
                    {mobileAvailability === "available" && isLoginFlow && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                        ✗
                      </div>
                    )}
                    {mobileAvailability === "not-available" && !isLoginFlow && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                        ✗
                      </div>
                    )}
                  </div>
                  {/* Show appropriate message based on login vs registration flow */}
                  {mobileAvailability === "available" && isLoginFlow && (
                    <p className="text-xs text-red-600 mt-1">Mobile number not registered. Please register first.</p>
                  )}
                  {mobileAvailability === "not-available" && !isLoginFlow && (
                    <p className="text-xs text-red-600 mt-1">Mobile number already registered. Please login instead.</p>
                  )}
                </div>
                
                {/* Quick Post is only for clients - no user type selection needed */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 text-center">
                    ✅ Logging in as client to post jobs
                  </p>
                </div>
                
                <Button 
                  onClick={handleSendOtp} 
                  className="w-full"
                  disabled={
                    isProcessing || 
                    mobileAvailability === "checking" || 
                    !quickAuthData.mobile || 
                    quickAuthData.mobile.length < 10 ||
                    (isLoginFlow && mobileAvailability === "available") ||
                    (!isLoginFlow && mobileAvailability === "not-available")
                  }
                >
                  {isProcessing ? "Sending..." : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Enter OTP</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                  <div className="space-y-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      OTP sent to {quickAuthData.mobile}
                    </p>
                    {generatedOtp && (
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span className="text-xs text-gray-600">
                          Development OTP: {generatedOtp}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOtp(generatedOtp)}
                          className="text-xs h-6 px-2"
                        >
                          Paste OTP
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleVerifyOtp} 
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Verifying..." : "Verify & Login"}
                </Button>
                
                <Button 
                  onClick={() => setOtpSent(false)} 
                  variant="outline"
                  className="w-full"
                >
                  Change Mobile Number
                </Button>
              </div>
            )}
            
            <Button 
              onClick={() => setCurrentStep('auth-check')} 
              variant="ghost"
              className="w-full"
            >
              ← Back
            </Button>
          </div>
        )}

        {/* Quick Registration Step */}
        {currentStep === 'register' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold">Quick Registration</h3>
              <p className="text-muted-foreground">Create your account to post jobs</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  type="text"
                  placeholder="Enter your first name"
                  value={quickAuthData.firstName}
                  onChange={(e) => setQuickAuthData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Mobile Number</label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={quickAuthData.mobile}
                    onChange={(e) => setQuickAuthData(prev => ({ ...prev, mobile: e.target.value }))}
                    maxLength={10}
                    className={
                      isLoginFlow 
                        ? (mobileAvailability === "available" ? "border-red-500" : "") 
                        : (mobileAvailability === "not-available" ? "border-red-500" : "")
                    }
                  />
                  {mobileAvailability === "checking" && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {/* Show checkmark based on login vs registration flow */}
                  {mobileAvailability === "available" && !isLoginFlow && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      ✓
                    </div>
                  )}
                  {mobileAvailability === "not-available" && isLoginFlow && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      ✓
                    </div>
                  )}
                  {mobileAvailability === "available" && isLoginFlow && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                      ✗
                    </div>
                  )}
                  {mobileAvailability === "not-available" && !isLoginFlow && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                      ✗
                    </div>
                  )}
                </div>
                {/* Show appropriate message based on login vs registration flow */}
                {mobileAvailability === "available" && isLoginFlow && (
                  <p className="text-xs text-red-600 mt-1">Mobile number not registered. Please register first.</p>
                )}
                {mobileAvailability === "not-available" && !isLoginFlow && (
                  <p className="text-xs text-red-600 mt-1">Mobile number already registered. Please login instead.</p>
                )}
              </div>
              
              {/* Quick Post is only for clients - no account type selection needed */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 text-center">
                  ✅ Creating a client account to post jobs and hire workers
                </p>
              </div>

              {/* Simplified registration note */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 text-center">
                  📍 Your address will be collected when you post your first job for security and accurate service delivery.
                </p>
              </div>
              
              <Button 
                onClick={handleQuickRegister} 
                className="w-full"
                disabled={
                  isProcessing || 
                  mobileAvailability === "checking" || 
                  !quickAuthData.mobile || 
                  !quickAuthData.firstName || 
                  quickAuthData.mobile.length < 10 ||
                  (isLoginFlow && mobileAvailability === "available") ||
                  (!isLoginFlow && mobileAvailability === "not-available")
                }
              >
                {isProcessing ? "Creating Account..." : "Create Account & Continue"}
              </Button>
            </div>
            
            <Button 
              onClick={() => setCurrentStep('auth-check')} 
              variant="ghost"
              className="w-full"
            >
              ← Back
            </Button>
          </div>
        )}

        {/* Role Restriction Step - for workers trying to post jobs */}
        {currentStep === 'role-restriction' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-orange-600 mb-2">Worker Account Detected</h3>
              <p className="text-muted-foreground mb-4">
                You're currently logged in as a <strong>Worker</strong>. Only <strong>Client</strong> accounts can post jobs and hire workers.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">What you can do:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Create a separate client account to post jobs</li>
                  <li>• Keep your worker account to receive job opportunities</li>
                  <li>• Many people have both client and worker accounts</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  // Start registration as client
                  setCurrentStep('register');
                }} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Create Client Account
              </Button>
              <Button 
                onClick={onClose} 
                variant="outline" 
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Language Selection Step */}
        {currentStep === 'language' && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Globe className="w-5 h-5" />
                <span>Choose your preferred language</span>
              </div>
              

              

            </div>
            
            <Select value={selectedLanguage} onValueChange={(value) => {
              setSelectedLanguage(value);
              // Go to recording screen but don't auto-start
              setTimeout(() => {
                setCurrentStep('recording');
              }, 200);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              {supportedLanguages.slice(0, 6).map(lang => (
                <Button
                  key={lang.code}
                  variant={selectedLanguage === lang.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    // Go to recording screen but don't auto-start
                    setTimeout(() => {
                      setCurrentStep('recording');
                    }, 200);
                  }}
                  className="justify-start text-sm transition-all duration-200 hover:scale-105"
                  data-testid={`language-btn-${lang.code}`}
                >
                  {lang.flag} {lang.name}
                </Button>
              ))}
            </div>

            {selectedLanguage && (
              <div className="text-center text-sm text-green-600 animate-fade-in">
                ✓ {supportedLanguages.find(l => l.code === selectedLanguage)?.name} selected
                <br />
                <span className="text-xs text-muted-foreground">Starting voice recording automatically...</span>
              </div>
            )}

            {/* Auto-proceed on selection - no continue button needed */}
          </div>
        )}

        {/* Recording Step */}
        {currentStep === 'recording' && (
          <div className="text-center space-y-4">
            {recordedAudio && !isProcessing && !isRecording ? (
              <>
                <div className="text-6xl">🎵</div>
                <h3 className="text-xl font-semibold">Recording Complete</h3>
                <p className="text-muted-foreground">
                  Listen to your recording or re-record if needed
                </p>
                
                {/* Audio Playback */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/webm" />
                    <source src={audioUrl} type="audio/mp4" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setRecordedAudio(null);
                      if (audioUrl) {
                        URL.revokeObjectURL(audioUrl);
                        setAudioUrl('');
                      }
                    }}
                    className="flex-1"
                  >
                    🗑️ Delete & Re-record
                  </Button>
                  <Button 
                    onClick={() => {
                      if (recordedAudio) {
                        processRecording(recordedAudio);
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!recordedAudio}
                  >
                    ✓ Use This Recording
                  </Button>
                </div>
              </>
            ) : isRecording ? (
              <>
                <div className="text-6xl animate-pulse">🔴</div>
                <h3 className="text-xl font-semibold text-red-600">Recording...</h3>
                <div className="text-2xl font-mono">
                  {formatDuration(recordingDuration)}
                </div>
                <div className="text-xs text-gray-500">
                  Timer: {recordingDuration}s
                </div>
                
                {/* Live recording tips */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">
                  <p className="text-sm text-red-700">
                    🗣️ <strong>Recording in progress...</strong>
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Speak clearly • Mention location & budget • No rush, take your time
                  </p>
                </div>
                
                {recordingDuration > 45 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                    <p className="text-xs text-orange-700">
                      💭 Good length! You can stop recording now or continue for more details.
                    </p>
                  </div>
                )}
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={stopRecording}
                  disabled={isProcessing}
                  className="animate-pulse"
                >
                  <Square className="w-5 h-5 mr-2 animate-bounce" />
                  Stop Recording
                </Button>
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin mx-auto" />
                <h3 className="text-xl font-semibold">Processing Your Voice...</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>🎤 Analyzing voice recording...</p>
                  <p>🧠 Extracting job details with AI...</p>
                  <p>📝 Creating job posting...</p>
                </div>
                <div className="bg-muted p-3 rounded-lg text-left text-sm">
                  <h4 className="font-semibold mb-2">What we're extracting:</h4>
                  <ul className="space-y-1">
                    <li>• Job title and description</li>
                    <li>• Service category</li>
                    <li>• Budget range</li>
                    <li>• Location details</li>
                    <li>• Urgency level</li>
                    <li>• Timeframe requirements</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Ready to start recording */}
                <div className="text-6xl animate-bounce">🎤</div>
                <h3 className="text-xl font-semibold">Ready to Record</h3>
                <p className="text-muted-foreground">
                  Click start when you're ready to describe your job in <strong>{supportedLanguages.find(l => l.code === selectedLanguage)?.name}</strong>
                </p>
                
                <Button 
                  size="lg" 
                  onClick={startRecording}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="start-recording-btn"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('language')}
                  className="w-full"
                >
                  Change Language
                </Button>
              </>
            )}
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && recordedAudio && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl">🎧</div>
              <h3 className="text-xl font-semibold">Review Your Voice Message</h3>
              <p className="text-muted-foreground">
                Listen to your recording before processing
              </p>
            </div>

            {/* Audio Playback */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-blue-800">Your Voice Recording:</h4>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/webm" />
                <source src={audioUrl} type="audio/mp4" />
                Your browser does not support the audio element.
              </audio>
              
              {/* Recording Details */}
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Language:</strong> {languageNames[selectedLanguage] || 'English'}</p>
                <p><strong>Duration:</strong> {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</p>
                <p><strong>Size:</strong> {(recordedAudio.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  if (recordedAudio) {
                    processRecording(recordedAudio);
                  }
                }}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Voice...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Process Voice & Create Job
                  </>
                )}
              </Button>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Re-record: go back to recording step
                    setCurrentStep('recording');
                    setRecordedAudio(null);
                    if (audioUrl) {
                      URL.revokeObjectURL(audioUrl);
                      setAudioUrl('');
                    }
                    setRecordingDuration(0);
                  }}
                  className="flex-1"
                >
                  🎙️ Record Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep('language')}
                  className="flex-1"
                >
                  🌐 Change Language
                </Button>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('manual-input')}
                className="w-full"
              >
                📝 Switch to Manual Entry
              </Button>
            </div>
          </div>
        )}

        {/* Location Confirmation Step */}
        {currentStep === 'location-confirmation' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl">📍</div>
              <h3 className="text-xl font-semibold">Confirm Job Details & Location</h3>
              <p className="text-muted-foreground">
                Please confirm the job details and specify the work location
              </p>
            </div>

            {extractedData && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Extracted Job Details:</h4>
                <div className="space-y-2">
                  <p><strong>Title:</strong> {extractedData.jobTitle || 'Voice-Generated Job Request'}</p>
                  <div>
                    <p><strong>Description:</strong></p>
                    <div className="bg-white rounded p-2 mt-1 space-y-1">
                      <p className="text-blue-800"><strong>{supportedLanguages.find(l => l.code === selectedLanguage)?.name || 'Original'}:</strong> {originalTranscription || "Original language not available"}</p>
                      <p className="text-green-800"><strong>English:</strong> {processedTranscription}</p>
                    </div>
                  </div>
                  <p><strong>Service:</strong> {extractedData.serviceCategory || 'General Services'}</p>
                  <p><strong>Urgency:</strong> {extractedData.urgency || 'medium'}</p>
                  <p><strong>Requirements:</strong> {extractedData.requirements?.join(', ') || 'Experience in the service category'}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Area/Locality</label>
                <Input
                  placeholder="Enter area or locality name"
                  value={locationData.area}
                  onChange={(e) => setLocationData(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">District</label>
                <Input
                  placeholder="Enter district name"
                  value={locationData.district}
                  onChange={(e) => setLocationData(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  placeholder="Enter state name"
                  value={locationData.state}
                  onChange={(e) => setLocationData(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>

              {/* Add New Work Location Button */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomLocationForm(!showCustomLocationForm)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  data-testid="button-add-custom-location"
                >
                  {showCustomLocationForm ? 'Use Current Location' : '+ Add New Work Location'}
                </Button>
                <p className="text-xs text-muted-foreground">Need different work address?</p>
              </div>

              {/* Custom Location Form */}
              {showCustomLocationForm && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-200">
                  <h5 className="font-medium text-blue-800">Enter Custom Work Location</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">House Number</label>
                      <Input
                        placeholder="123, Building name"
                        value={customLocationData.houseNumber}
                        onChange={(e) => setCustomLocationData(prev => ({ ...prev, houseNumber: e.target.value }))}
                        data-testid="input-custom-house-number"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Street Name</label>
                      <Input
                        placeholder="Main street, road name"
                        value={customLocationData.streetName}
                        onChange={(e) => setCustomLocationData(prev => ({ ...prev, streetName: e.target.value }))}
                        data-testid="input-custom-street-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Area/Locality</label>
                    <Input
                      placeholder="Area or locality name"
                      value={customLocationData.areaName}
                      onChange={(e) => setCustomLocationData(prev => ({ ...prev, areaName: e.target.value }))}
                      data-testid="input-custom-area-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">District</label>
                      <Input
                        placeholder="District name"
                        value={customLocationData.district}
                        onChange={(e) => setCustomLocationData(prev => ({ ...prev, district: e.target.value }))}
                        data-testid="input-custom-district"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">State</label>
                      <Input
                        placeholder="State name"
                        value={customLocationData.state}
                        onChange={(e) => setCustomLocationData(prev => ({ ...prev, state: e.target.value }))}
                        data-testid="input-custom-state"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pincode</label>
                    <Input
                      placeholder="6-digit pincode"
                      maxLength={6}
                      value={customLocationData.pincode}
                      onChange={(e) => setCustomLocationData(prev => ({ ...prev, pincode: e.target.value }))}
                      data-testid="input-custom-pincode"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium">Budget Range (₹) *Required</label>
                <div className="space-y-2">
                  {extractedData?.budget ? (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                      <span className="text-blue-800">Detected Budget: ₹{extractedData.budget.min} - ₹{extractedData.budget.max}</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                      <span className="text-yellow-800">No budget mentioned in voice. Please enter your budget range:</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min amount (₹)"
                      value={locationData.budgetMin || (extractedData?.budget?.min ? extractedData.budget.min.toString() : '')}
                      onChange={(e) => setLocationData(prev => ({ ...prev, budgetMin: e.target.value }))}
                      required
                    />
                    <span className="self-center">-</span>
                    <Input
                      type="number"
                      placeholder="Max amount (₹)"
                      value={locationData.budgetMax || (extractedData?.budget?.max ? extractedData.budget.max.toString() : '')}
                      onChange={(e) => setLocationData(prev => ({ ...prev, budgetMax: e.target.value }))}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the amount you're willing to pay for this service
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Work Location</label>
                <div className="space-y-2">
                  {extractedData?.location && (extractedData.location.area || extractedData.location.district || extractedData.location.state) ? (
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                      <span className="text-green-800">Detected Location: {[extractedData.location.area, extractedData.location.district, extractedData.location.state].filter(Boolean).join(', ')}</span>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                      <span className="text-blue-800">Using your profile address. You can modify the location above if needed.</span>
                    </div>
                  )}
                  <Input
                    placeholder="Additional address details (optional)"
                    value={locationData.fullAddress}
                    onChange={(e) => setLocationData(prev => ({ ...prev, fullAddress: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('recording')}
                className="flex-1"
              >
                ← Back to Recording
              </Button>
              <Button 
                onClick={confirmJobPosting}
                disabled={!locationData.area || !locationData.district || !locationData.state || !locationData.budgetMin || !locationData.budgetMax || isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting Job...
                  </>
                ) : (
                  'Post Job'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {currentStep === 'success' && processedResult && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 text-green-600">✓</div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">
                Your job has been posted successfully. Workers will start bidding soon.
              </p>
            </div>

            {/* Audio Playback Section */}
            {audioUrl && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-blue-800">Your Voice Recording:</h4>
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/webm" />
                  <source src={audioUrl} type="audio/mp4" />
                  Your browser does not support the audio element.
                </audio>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentStep('recording');
                    setProcessedResult(null);
                    setRecordedAudio(null);
                    if (audioUrl) {
                      URL.revokeObjectURL(audioUrl);
                      setAudioUrl('');
                    }
                  }}
                  className="w-full"
                >
                  🎤 Record Again
                </Button>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
              <h4 className="font-semibold text-gray-800">Job Details:</h4>
              
              <div>
                <span className="font-medium">Title:</span> {processedResult.jobPost?.title || 'Voice-Generated Job Request'}
              </div>
              
              <div>
                <span className="font-medium">Description:</span>
                <div className="bg-white rounded p-2 mt-1 space-y-1">
                  <p className="text-blue-800"><strong>Tamil:</strong> {processedResult.transcription || 'Voice recording processed'}</p>
                  <p className="text-green-800"><strong>English:</strong> {processedResult.extractedData?.jobDescription || processedResult.jobPost?.description || 'Professional service required'}</p>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Service:</span> {processedResult.extractedData?.serviceCategory || 'General Services'}
              </div>
              
              <div>
                <span className="font-medium">Budget:</span> ₹{processedResult.extractedData?.budget?.min || processedResult.jobPost?.budgetMin || 1000} - ₹{processedResult.extractedData?.budget?.max || processedResult.jobPost?.budgetMax || 5000}
              </div>
              
              <div>
                <span className="font-medium">Location:</span> {processedResult.jobPost?.serviceAddress || `${user?.areaName || 'Area'}, ${user?.district || 'District'}, ${user?.state || 'State'}`}
              </div>
              
              <div>
                <span className="font-medium">Requirements:</span> {processedResult.extractedData?.requirements?.join(', ') || 'Experience in the service category'}
              </div>
              
              <div>
                <span className="font-medium">Voice Transcription:</span>
                <p className="text-sm text-gray-600 italic mt-1">"{processedResult.transcription}"</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={onClose} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Close
              </Button>
              <Button 
                onClick={() => {
                  setCurrentStep('language');
                  setProcessedResult(null);
                  setRecordedAudio(null);
                  if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    setAudioUrl('');
                  }
                  // Reset location data with user profile
                  setLocationData({
                    area: user?.areaName || '',
                    district: user?.district || '', 
                    state: user?.state || '',
                    fullAddress: user?.fullAddress || '',
                    budgetMin: '',
                    budgetMax: ''
                  });
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Create Another Job
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}