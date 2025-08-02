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
  supportedLanguages?: string[];
}

export function VoiceInput({ 
  onTranscript, 
  language = "en-US", 
  className = "",
  size = "sm",
  showStatus = true,
  supportedLanguages = ["en-US", "ta-IN", "hi-IN"]
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const { toast } = useToast();

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isReplit = window.location.hostname.includes('replit.dev');
    
    // Detect browser type
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const isChrome = navigator.userAgent.toLowerCase().includes('chrome');
    const isEdge = navigator.userAgent.toLowerCase().includes('edge');
    const isSafari = navigator.userAgent.toLowerCase().includes('safari') && !isChrome;
    
    console.log("Speech recognition support check:", { 
      supported, 
      SpeechRecognition: !!SpeechRecognition,
      isHTTPS,
      isLocalhost,
      isReplit,
      isFirefox,
      isChrome,
      isEdge,
      isSafari,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent
    });
    
    // Enable for HTTPS, localhost, or Replit environments
    setSpeechSupported(supported && (isHTTPS || isLocalhost || isReplit));
  }, []);

  const startVoiceRecognition = () => {
    console.log("Voice recognition clicked!", { speechSupported, isListening });
    
    if (!speechSupported) {
      toast({
        title: "Speech not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      console.log("Recognition created:", recognition);

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguage;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        console.log("Recognition started");
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak now to describe your service requirement",
        });
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
          toast({
            title: "Voice input captured",
            description: `Recognized: "${finalTranscript.trim()}"`,
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Recognition error:", event.error);
        setIsListening(false);
        toast({
          title: "Voice recognition error",
          description: `Error: ${event.error}. Please try again or type your request`,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      console.log("Recognition.start() called");
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast({
        title: "Voice recognition failed",
        description: "Could not start voice recognition",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecognition = () => {
    setIsListening(false);
  };

  // Always render the button but show different states
  const isDisabled = !speechSupported;
  
  const handleClick = () => {
    if (isDisabled) {
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      const browserMessage = isFirefox 
        ? "Firefox doesn't support voice recognition. Please use Chrome, Edge, or Safari for voice input."
        : "Voice recognition requires a supported browser (Chrome, Edge, Safari) and secure connection.";
      
      toast({
        title: "Voice input not available",
        description: `${browserMessage} Please try typing your request instead.`,
        variant: "destructive",
      });
      return;
    }
    
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };
  
  if (isDisabled) {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        className={`text-gray-400 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:text-gray-500 ${className}`}
        onClick={handleClick}
        title="🎤 Voice input - Firefox not supported. Use Chrome/Edge/Safari"
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
        onClick={handleClick}
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