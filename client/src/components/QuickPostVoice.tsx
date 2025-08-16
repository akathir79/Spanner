import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Mic, MicOff, Play, Pause, User, MapPin, Briefcase, ArrowRight, Volume2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioBlob: Blob | null;
  transcription: string;
  detectedLanguage: string;
  recordingDuration: number;
}

interface JobData {
  jobTitle: string;
  jobDescription: string;
  serviceCategory: string;
  urgency: 'low' | 'medium' | 'high';
  budget: { min: number; max: number } | null;
  location: {
    area?: string;
    district?: string;
    state?: string;
    fullAddress?: string;
  };
  requirements: string[];
  timeframe: string;
  originalLanguage: string;
}

interface UserData {
  firstName: string;
  lastName: string;
  mobile?: string;
  location: {
    area?: string;
    district?: string;
    state?: string;
  };
}

export default function QuickPostVoice() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Voice recording state
  const [voiceState, setVoiceState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    audioBlob: null,
    transcription: '',
    detectedLanguage: 'en',
    recordingDuration: 0,
  });

  // Flow state management
  const [currentStep, setCurrentStep] = useState<'welcome' | 'recording' | 'job-review' | 'user-info' | 'posting'>('welcome');
  const [extractedJob, setExtractedJob] = useState<JobData | null>(null);
  const [extractedUser, setExtractedUser] = useState<UserData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Language support info
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
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  ];

  // Check microphone permission and support
  const checkMicrophoneSupport = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Microphone Not Supported",
        description: "Your browser doesn't support voice recording. Please use a modern browser.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      toast({
        title: "Microphone Permission Required",
        description: "Please allow microphone access to use voice posting feature.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Start voice recording
  const startRecording = useCallback(async () => {
    if (!await checkMicrophoneSupport()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true 
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setVoiceState(prev => ({ ...prev, audioBlob }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setVoiceState(prev => ({ 
        ...prev, 
        isRecording: true, 
        recordingDuration: 0,
        transcription: '',
        detectedLanguage: 'en'
      }));
      setCurrentStep('recording');

      // Start duration timer
      timerRef.current = setInterval(() => {
        setVoiceState(prev => ({ 
          ...prev, 
          recordingDuration: prev.recordingDuration + 1 
        }));
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to start voice recording. Please check your microphone.",
        variant: "destructive"
      });
    }
  }, [checkMicrophoneSupport, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
      setVoiceState(prev => ({ ...prev, isRecording: false }));
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [voiceState.isRecording]);

  // Process audio and extract information
  const processAudio = useCallback(async () => {
    if (!voiceState.audioBlob) return;

    setVoiceState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Convert audio to base64
      const arrayBuffer = await voiceState.audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Transcribe audio
      const transcriptionResult = await apiRequest('POST', '/api/voice/transcribe', {
        audioData: base64Audio,
        mimeType: 'audio/webm'
      });

      setVoiceState(prev => ({
        ...prev,
        transcription: transcriptionResult.text,
        detectedLanguage: transcriptionResult.detectedLanguage,
        isProcessing: false
      }));

      // Extract job information
      if (user) {
        // User is logged in, extract job info directly
        const jobResult = await apiRequest('POST', '/api/voice/extract-job', {
          text: transcriptionResult.text,
          detectedLanguage: transcriptionResult.detectedLanguage
        });

        setExtractedJob(jobResult);
        setCurrentStep('job-review');
      } else {
        // User not logged in, extract user info first
        const userResult = await apiRequest('POST', '/api/voice/extract-user', {
          text: transcriptionResult.text,
          detectedLanguage: transcriptionResult.detectedLanguage
        });

        setExtractedUser(userResult);
        setCurrentStep('user-info');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Failed",
        description: "Unable to process voice recording. Please try again.",
        variant: "destructive"
      });
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [voiceState.audioBlob, user, toast]);

  // Play recorded audio
  const playRecording = useCallback(() => {
    if (!voiceState.audioBlob) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const audioUrl = URL.createObjectURL(voiceState.audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
      }
    }
  }, [voiceState.audioBlob, isPlaying]);

  // Create user account and continue
  const createUserAndContinue = useCallback(async () => {
    if (!extractedUser) return;

    try {
      setCurrentStep('posting');

      // Create user account using extracted information
      const userData = {
        ...extractedUser,
        role: 'client',
        password: 'quickpost123', // Temporary password
        confirmPassword: 'quickpost123'
      };

      const newUser = await apiRequest('POST', '/api/auth/quick-signup', userData);
      
      toast({
        title: "Account Created Successfully",
        description: `Welcome ${newUser.firstName}! Your account has been created.`
      });

      // Now extract job information from the same transcription
      const jobResult = await apiRequest('POST', '/api/voice/extract-job', {
        text: voiceState.transcription,
        detectedLanguage: voiceState.detectedLanguage
      });

      setExtractedJob(jobResult);
      setCurrentStep('job-review');

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Account Creation Failed",
        description: "Unable to create account. Please provide more details or try manual registration.",
        variant: "destructive"
      });
      setCurrentStep('user-info');
    }
  }, [extractedUser, voiceState.transcription, voiceState.detectedLanguage, toast]);

  // Post the job
  const postJob = useCallback(async () => {
    if (!extractedJob) return;

    try {
      setCurrentStep('posting');

      const jobData = {
        title: extractedJob.jobTitle,
        description: extractedJob.jobDescription,
        serviceCategory: extractedJob.serviceCategory,
        urgencyLevel: extractedJob.urgency,
        budget: extractedJob.budget?.max || 1000,
        location: `${extractedJob.location.area || ''}, ${extractedJob.location.district || ''}, ${extractedJob.location.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
        requirements: extractedJob.requirements.join(', '),
        timeframe: extractedJob.timeframe,
        isVoicePosted: true,
        originalLanguage: extractedJob.originalLanguage
      };

      const newJob = await apiRequest('POST', '/api/job-postings', jobData);

      toast({
        title: "Job Posted Successfully!",
        description: "Your job has been posted and workers will start bidding soon."
      });

      // Redirect to job details or dashboard
      setLocation(`/client-dashboard`);

    } catch (error) {
      console.error('Error posting job:', error);
      toast({
        title: "Job Posting Failed",
        description: "Unable to post job. Please try again or use manual posting.",
        variant: "destructive"
      });
      setCurrentStep('job-review');
    }
  }, [extractedJob, toast, setLocation]);

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get language display name
  const getLanguageName = (code: string) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && voiceState.isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [voiceState.isRecording]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Volume2 className="w-6 h-6" />
            Quick Post with Voice
          </CardTitle>
          <p className="text-muted-foreground">
            Post jobs quickly using your voice in any Indian language
          </p>
        </CardHeader>
      </Card>

      {/* Language Support Info */}
      {currentStep === 'welcome' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {supportedLanguages.map(lang => (
                <Badge key={lang.code} variant="outline" className="justify-center">
                  {lang.flag} {lang.name}
                </Badge>
              ))}
            </div>
            <Alert className="mt-4">
              <AlertDescription>
                Speak naturally in your preferred language. We'll automatically detect the language and translate your job post to English.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Welcome Step */}
      {currentStep === 'welcome' && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-6xl">🎤</div>
            <h3 className="text-xl font-semibold">Ready to Post a Job?</h3>
            <p className="text-muted-foreground">
              Just click the microphone and tell us:
              <br />• What service you need
              <br />• Where you're located (area, district, state)
              <br />• Any specific requirements
              <br />• Your budget and timeline
            </p>
            {!user && (
              <Alert>
                <AlertDescription>
                  You're not logged in. We'll help you create an account during the process.
                </AlertDescription>
              </Alert>
            )}
            <Button 
              size="lg" 
              onClick={startRecording}
              className="w-full"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Recording
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recording Step */}
      {currentStep === 'recording' && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-6xl animate-pulse">🔴</div>
            <h3 className="text-xl font-semibold text-red-600">Recording...</h3>
            <div className="text-2xl font-mono">
              {formatDuration(voiceState.recordingDuration)}
            </div>
            <p className="text-muted-foreground">
              Tell us about the job you want to post. Include service type, location, requirements, and timeline.
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button 
                variant="destructive" 
                size="lg"
                onClick={stopRecording}
                disabled={voiceState.isProcessing}
              >
                <MicOff className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            </div>

            {voiceState.audioBlob && (
              <div className="mt-6 space-y-4">
                <Alert>
                  <AlertDescription>
                    Recording completed! Processing your voice...
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={playRecording}
                    disabled={voiceState.isProcessing}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isPlaying ? 'Pause' : 'Play'} Recording
                  </Button>
                  
                  <Button
                    onClick={processAudio}
                    disabled={voiceState.isProcessing}
                  >
                    {voiceState.isProcessing ? (
                      <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {voiceState.isProcessing ? 'Processing...' : 'Continue'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transcription Display */}
      {voiceState.transcription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>{getLanguageName(voiceState.detectedLanguage)}</Badge>
              Voice Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <p className="italic">"{voiceState.transcription}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Info Step - for non-logged in users */}
      {currentStep === 'user-info' && extractedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Create Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                We've extracted this information from your voice. Please verify and complete:
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={extractedUser.firstName || ''} readOnly />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={extractedUser.lastName || ''} readOnly />
              </div>
            </div>

            {extractedUser.mobile && (
              <div>
                <Label>Mobile Number</Label>
                <Input value={extractedUser.mobile} readOnly />
              </div>
            )}

            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                value={`${extractedUser.location.area || ''}, ${extractedUser.location.district || ''}, ${extractedUser.location.state || ''}`.replace(/^,\s*|,\s*$/g, '')} 
                readOnly 
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep('welcome')}>
                Record Again
              </Button>
              <Button onClick={createUserAndContinue}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Create Account & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Review Step */}
      {currentStep === 'job-review' && extractedJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Review Your Job Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                We've extracted this job information from your voice. Review and confirm:
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label>Job Title</Label>
                <Input value={extractedJob.jobTitle} readOnly />
              </div>

              <div>
                <Label>Service Category</Label>
                <Badge variant="secondary">{extractedJob.serviceCategory}</Badge>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={extractedJob.jobDescription} 
                  readOnly 
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Urgency</Label>
                  <Badge variant={extractedJob.urgency === 'high' ? 'destructive' : extractedJob.urgency === 'medium' ? 'default' : 'secondary'}>
                    {extractedJob.urgency}
                  </Badge>
                </div>
                
                {extractedJob.budget && (
                  <div>
                    <Label>Budget Range</Label>
                    <Input 
                      value={`₹${extractedJob.budget.min} - ₹${extractedJob.budget.max}`} 
                      readOnly 
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Location</Label>
                <Input 
                  value={`${extractedJob.location.area || ''}, ${extractedJob.location.district || ''}, ${extractedJob.location.state || ''}`.replace(/^,\s*|,\s*$/g, '')} 
                  readOnly 
                />
              </div>

              <div>
                <Label>Requirements</Label>
                <div className="flex flex-wrap gap-2">
                  {extractedJob.requirements.map((req, index) => (
                    <Badge key={index} variant="outline">{req}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Timeframe</Label>
                <Input value={extractedJob.timeframe} readOnly />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setCurrentStep('welcome')}>
                Record Again
              </Button>
              <Button onClick={postJob}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Post Job
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posting Step */}
      {currentStep === 'posting' && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <h3 className="text-xl font-semibold">Posting Your Job...</h3>
            <p className="text-muted-foreground">
              Please wait while we process your job posting.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}