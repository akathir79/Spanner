import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  const { user } = useAuth();
  const { toast } = useToast();

  // Simple state management
  const [currentStep, setCurrentStep] = useState<'language' | 'recording' | 'success'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [processedResult, setProcessedResult] = useState<any>(null);

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

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('language');
      setSelectedLanguage('en');
      setIsRecording(false);
      setIsProcessing(false);
      setRecordingDuration(0);
    }
  }, [isOpen]);

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
                <h3 className="text-xl font-semibold">Processing...</h3>
                <p className="text-muted-foreground">
                  Converting your voice to job posting...
                </p>
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