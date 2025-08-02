import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff } from "lucide-react";

// Add TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  showStatus?: boolean;
}

export function VoiceInput({ 
  onTranscript, 
  language = "en-US", 
  className = "",
  size = "sm",
  showStatus = true 
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { toast } = useToast();

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const startVoiceRecognition = () => {
    if (!speechSupported) {
      toast({
        title: "Speech not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      
      toast({
        title: "Voice input captured",
        description: `Recognized: "${transcript}"`,
      });
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: "Voice recognition error",
        description: "Please try again or type your request",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceRecognition = () => {
    setIsListening(false);
  };

  if (!speechSupported) {
    return null; // Don't render if speech is not supported
  }

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="ghost"
        size={size}
        className={`${isListening 
          ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100" 
          : "text-muted-foreground hover:text-foreground"
        } ${className}`}
        onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
        title={isListening ? "Stop voice input" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {showStatus && isListening && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
          Listening...
        </p>
      )}
    </div>
  );
}