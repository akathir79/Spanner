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

  // Simple state management
  const [currentStep, setCurrentStep] = useState<'auth-check' | 'login' | 'register' | 'language' | 'recording' | 'success'>('auth-check');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [processedResult, setProcessedResult] = useState<any>(null);
  
  // Quick auth states
  const [quickAuthData, setQuickAuthData] = useState({
    mobile: '',
    firstName: '',
    lastName: '',
    role: 'client' as 'client' | 'worker'
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

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
        stream.getTracks().forEach(track => track.stop());
        processRecording(audioBlob);
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
      
      console.log("Sending voice data to server:", {
        audioSize: base64Audio.length,
        mimeType: audioBlob.type,
        language: selectedLanguage,
        userId: user?.id,
        userObject: user
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
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.jobPost) {
        setProcessedResult(result);
        toast({
          title: "Job Posted Successfully!",
          description: `Your job "${result.jobPost.title}" has been created and is now live.`
        });
        setCurrentStep('success');
      } else {
        throw new Error(result.message || 'Failed to process voice recording');
      }
      
    } catch (error: any) {
      console.error("Voice processing error:", error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process your voice recording. Please try again.",
        variant: "destructive"
      });
      setCurrentStep('recording');
    } finally {
      setIsProcessing(false);
    }
  }, [toast, selectedLanguage, user]);

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mobile: quickAuthData.mobile, 
          role: quickAuthData.role 
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: `OTP sent to ${quickAuthData.mobile}. Development OTP: ${result.otp || '123456'}`,
        });
      } else {
        throw new Error(result.message || 'Failed to send OTP');
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
  }, [quickAuthData, toast]);

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
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mobile: quickAuthData.mobile, 
          otp: otp, 
          purpose: 'login' 
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.user) {
        // Store user in localStorage like other forms do
        localStorage.setItem("user", JSON.stringify(result.user));
        
        toast({
          title: "Login Successful",
          description: `Welcome ${result.user.firstName}!`
        });
        
        // Trigger a reload to update auth state
        window.location.reload();
      } else {
        throw new Error(result.message || 'Invalid OTP or failed to login');
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
  }, [otp, quickAuthData.mobile, toast]);

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
      const response = await fetch("/api/auth/signup/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: quickAuthData.firstName,
          lastName: quickAuthData.lastName,
          mobile: quickAuthData.mobile,
          role: quickAuthData.role
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.user) {
        // Store user in localStorage like other forms do
        localStorage.setItem("user", JSON.stringify(result.user));
        
        toast({
          title: "Registration Successful",
          description: `Welcome ${result.user.firstName}! Account created successfully.`
        });
        
        // Trigger a reload to update auth state
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to create account');
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
  }, [quickAuthData, toast]);

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
            Quick Post with Voice
          </DialogTitle>
        </DialogHeader>

        {/* Authentication Check Step */}
        {currentStep === 'auth-check' && (
          <div className="text-center space-y-4">
            <div className="text-6xl">🔐</div>
            <h3 className="text-xl font-semibold">Quick Post Authentication</h3>
            <p className="text-muted-foreground">
              To create a voice job post, you need to be logged in.
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
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      OTP sent to {quickAuthData.mobile}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOtp('123456')}
                      className="text-xs h-6 px-2"
                    >
                      Paste Dev OTP
                    </Button>
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
            {isRecording ? (
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
                  Speak about your job requirements in <strong>{supportedLanguages.find(l => l.code === selectedLanguage)?.name}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Example: "I need a plumber to fix my kitchen sink in Anna Nagar, Chennai. Budget is around 2000 rupees. It's urgent."
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

        {/* Success Step */}
        {currentStep === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-6xl">✅</div>
            <h3 className="text-xl font-semibold text-green-600">Success!</h3>
            <p className="text-muted-foreground">
              Your job has been posted successfully. Workers will start bidding soon.
            </p>
            
            {processedResult && (
              <div className="text-left bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Job Details:</h4>
                <p><strong>Title:</strong> {processedResult.jobPost.title}</p>
                <p><strong>Description:</strong> {processedResult.jobPost.description}</p>
                <p><strong>Budget:</strong> ₹{processedResult.jobPost.budget.min.toLocaleString('en-IN')} - ₹{processedResult.jobPost.budget.max.toLocaleString('en-IN')}</p>
                <p><strong>Location:</strong> {processedResult.jobPost.location}</p>
                
                {processedResult.transcription && (
                  <div className="mt-2 pt-2 border-t">
                    <h5 className="font-semibold text-sm">Voice Transcription:</h5>
                    <p className="text-sm italic">"{processedResult.transcription}"</p>
                  </div>
                )}
              </div>
            )}
            
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}