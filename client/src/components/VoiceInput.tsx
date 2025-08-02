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
    // Still render the icon but disable it to show the feature exists
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        className={`text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed ${className}`}
        disabled
        title="❌ Voice input not supported in this browser"
      >
        <Mic className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="outline"
        size={size}
        className={`${isListening 
          ? "text-white bg-red-500 hover:bg-red-600 border-red-500 animate-pulse shadow-lg" 
          : "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-300 hover:border-blue-400 shadow-sm"
        } ${className} transition-all duration-200 relative z-10`}
        onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
        title={isListening ? "🔴 Recording... Click to stop" : "🎤 Click to speak your service requirement"}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
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