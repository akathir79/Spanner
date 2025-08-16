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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        processRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to use voice recording.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
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
    setIsProcessing(true);
    
    // Simulate processing for demo
    setTimeout(() => {
      toast({
        title: "Job Posted Successfully!",
        description: "Your voice job posting has been created and is now live."
      });
      setIsProcessing(false);
      setCurrentStep('success');
    }, 2000);
  }, [toast]);

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
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Voice Recording
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
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}