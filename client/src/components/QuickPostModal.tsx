import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, Loader2, Globe } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState<'auth-check' | 'login' | 'register' | 'language' | 'recording' | 'preview' | 'manual-input' | 'success' | 'location-confirmation'>('auth-check');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
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
  
  // Quick auth states
  const [quickAuthData, setQuickAuthData] = useState({
    mobile: '',
    firstName: '',
    lastName: '',
    role: 'client' as 'client' | 'worker'
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  // Location confirmation states
  const [extractedData, setExtractedData] = useState<any>(null);
  const [processedTranscription, setProcessedTranscription] = useState('');
  const [locationData, setLocationData] = useState({
    area: '',
    district: '',
    state: '',
    fullAddress: ''
  });

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
        // User is logged in, go directly to language selection
        setCurrentStep('language');
      } else {
        // User not logged in, start with auth check
        setCurrentStep('auth-check');
      }
      setSelectedLanguage('en');
      setIsRecording(false);
      setIsProcessing(false);
      setRecordingDuration(0);
      setOtpSent(false);
      setOtp('');
      setQuickAuthData({
        mobile: '',
        firstName: '',
        lastName: '',
        role: 'client'
      });
    }
  }, [isOpen, user]);

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
      
      // Start recording immediately and set state
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer immediately (don't wait for onstart event)
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log("Recording duration:", newDuration);
          return newDuration;
        });
      }, 1000);
      
      mediaRecorder.start(1000); // Record in 1-second chunks

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
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
          locationData
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
  }, [extractedData, processedTranscription, locationData, user, toast, onClose]);

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
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
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
        setExtractedData(result.extractedData);
        setProcessedTranscription(result.transcription);
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
    if (!quickAuthData.firstName || !quickAuthData.lastName || !quickAuthData.mobile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await signupClient({
        firstName: quickAuthData.firstName,
        lastName: quickAuthData.lastName,
        mobile: quickAuthData.mobile,
        role: quickAuthData.role
      });
      
      if (result.success && result.user) {
        toast({
          title: "Registration Successful",
          description: `Welcome ${result.user.firstName}! Account created successfully.`
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
      <DialogContent className="max-w-lg">
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
              <Button onClick={() => setCurrentStep('login')} className="w-full">
                I Have an Account
              </Button>
              <Button onClick={() => setCurrentStep('register')} variant="outline" className="w-full">
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
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={quickAuthData.mobile}
                    onChange={(e) => setQuickAuthData(prev => ({ ...prev, mobile: e.target.value }))}
                    maxLength={10}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">User Type</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={quickAuthData.role === 'client' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuickAuthData(prev => ({ ...prev, role: 'client' }))}
                    >
                      Client
                    </Button>
                    <Button
                      variant={quickAuthData.role === 'worker' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuickAuthData(prev => ({ ...prev, role: 'worker' }))}
                    >
                      Worker
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendOtp} 
                  className="w-full"
                  disabled={isProcessing}
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    type="text"
                    placeholder="First name"
                    value={quickAuthData.firstName}
                    onChange={(e) => setQuickAuthData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={quickAuthData.lastName}
                    onChange={(e) => setQuickAuthData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={quickAuthData.mobile}
                  onChange={(e) => setQuickAuthData(prev => ({ ...prev, mobile: e.target.value }))}
                  maxLength={10}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Account Type</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={quickAuthData.role === 'client' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickAuthData(prev => ({ ...prev, role: 'client' }))}
                  >
                    Client (Post Jobs)
                  </Button>
                  <Button
                    variant={quickAuthData.role === 'worker' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickAuthData(prev => ({ ...prev, role: 'worker' }))}
                  >
                    Worker (Find Jobs)
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handleQuickRegister} 
                className="w-full"
                disabled={isProcessing}
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

        {/* Language Selection Step */}
        {currentStep === 'language' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span>Choose your preferred language</span>
            </div>
            
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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
                  onClick={() => setSelectedLanguage(lang.code)}
                  className="justify-start text-sm"
                >
                  {lang.flag} {lang.name}
                </Button>
              ))}
            </div>

            <Button 
              onClick={() => setCurrentStep('recording')} 
              className="w-full"
            >
              Continue to Voice Recording
            </Button>
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
                <p className="text-sm text-muted-foreground">
                  Speak clearly about your job requirements
                </p>
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={stopRecording}
                  disabled={isProcessing}
                >
                  <MicOff className="w-5 h-5 mr-2" />
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
                <div className="text-6xl">🎤</div>
                <h3 className="text-xl font-semibold">Ready to Record</h3>
                <p className="text-muted-foreground">
                  Describe what work you need done in <strong>{supportedLanguages.find(l => l.code === selectedLanguage)?.name}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Example: "I need a plumber to fix my kitchen tap leak in Anna Nagar, Chennai. My budget is 2000 rupees. Please come today."
                </p>
                <Button 
                  size="lg" 
                  onClick={startRecording}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="start-recording-btn"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Voice Recording
                </Button>
                
                {/* Debug fallback button for testing */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log("Debug: Force start recording UI");
                    setIsRecording(true);
                    setRecordingDuration(0);
                    timerRef.current = setInterval(() => {
                      setRecordingDuration(prev => prev + 1);
                    }, 1000);
                  }}
                  className="text-xs"
                >
                  Debug: Force Start Timer
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
              <h3 className="text-xl font-semibold">Confirm Job Location</h3>
              <p className="text-muted-foreground">
                Please confirm where the work needs to be done
              </p>
            </div>

            {extractedData && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Extracted Job Details:</h4>
                <p><strong>Title:</strong> {extractedData.jobTitle || 'Voice-Generated Job Request'}</p>
                <p><strong>Description:</strong> {extractedData.jobDescription || processedTranscription}</p>
                <p><strong>Service:</strong> {extractedData.serviceCategory || 'General Services'}</p>
                <p><strong>Urgency:</strong> {extractedData.urgency || 'medium'}</p>
                {extractedData.budget && (
                  <p><strong>Budget:</strong> ₹{extractedData.budget.min || 1000} - ₹{extractedData.budget.max || 5000}</p>
                )}
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
              
              <div>
                <label className="text-sm font-medium">Full Address (Optional)</label>
                <Input
                  placeholder="Enter complete address"
                  value={locationData.fullAddress}
                  onChange={(e) => setLocationData(prev => ({ ...prev, fullAddress: e.target.value }))}
                />
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
                disabled={!locationData.area || !locationData.district || !locationData.state || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  'Confirm & Post Job'
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
                <span className="font-medium">Title:</span> {processedResult.jobPost?.title || 'N/A'}
              </div>
              
              <div>
                <span className="font-medium">Description:</span> {processedResult.jobPost?.description || 'N/A'}
              </div>
              
              <div>
                <span className="font-medium">Budget:</span> ₹{processedResult.jobPost?.budget?.min || 0} - ₹{processedResult.jobPost?.budget?.max || 0}
              </div>
              
              <div>
                <span className="font-medium">Location:</span> {processedResult.jobPost?.location || 'N/A'}
              </div>
              
              {processedResult.transcription && (
                <div>
                  <span className="font-medium">Voice Transcription:</span>
                  <p className="text-sm text-gray-600 italic mt-1">"{processedResult.transcription}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentStep('language');
                  setProcessedResult(null);
                  setRecordedAudio(null);
                  if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    setAudioUrl('');
                  }
                }}
                className="flex-1"
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