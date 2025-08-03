import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Volume2 } from "lucide-react";

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  onServiceSelect: (serviceId: string) => void;
  onDistrictSelect: (districtId: string) => void;
  onDescriptionUpdate: (description: string) => void;
  services: Array<{ id: string; name: string; tamil_name?: string }>;
  districts: Array<{ id: string; name: string; tamil_name?: string }>;
  className?: string;
}

interface ConversationStep {
  step: number;
  field: 'service' | 'district' | 'description';
  question: {
    english: string;
    tamil: string;
  };
  expectedAnswers?: string[];
}

const conversationSteps: ConversationStep[] = [
  {
    step: 0,
    field: 'service',
    question: {
      english: "What type of service do you need? For example, say plumber, electrician, painter, or mechanic.",
      tamil: ""
    }
  },
  {
    step: 1,
    field: 'district',
    question: {
      english: "Which district are you in? Please say your district name.",
      tamil: ""
    }
  },
  {
    step: 2,
    field: 'description',
    question: {
      english: "Please describe your service requirement in detail.",
      tamil: ""
    }
  }
];

export function VoiceAssistant({
  onServiceSelect,
  onDistrictSelect,
  onDescriptionUpdate,
  services,
  districts,
  className = ""
}: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const selectedLanguage = 'english';
  const [speechSupported, setSpeechSupported] = useState(false);
  const [conversation, setConversation] = useState<string[]>([]);
  const [isConversationActive, setIsConversationActive] = useState(false);
  
  // Use ref to persist conversation state across re-renders
  const conversationActiveRef = useRef(false);
  const dialogOpenRef = useRef(false);
  const currentStepRef = useRef(0);
  const { toast } = useToast();

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Text-to-speech function with auto-listen after speech
  const speak = (text: string, lang: string = 'en-US', autoListen: boolean = true) => {
    if ('speechSynthesis' in window) {
      // Clear any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'tamil' ? 'ta-IN' : 'en-US';
      utterance.rate = 0.8;
      utterance.volume = 1;
      
      let speechEnded = false;
      
      // Auto-start listening after speech completes
      if (autoListen) {
        utterance.onend = () => {
          if (!speechEnded) {
            speechEnded = true;
            console.log('Speech ended, auto-starting listening...', { isOpen, isListening });
            setTimeout(() => {
              // Use refs for reliable state checking
              const currentConversationActive = conversationActiveRef.current;
              const currentDialogOpen = dialogOpenRef.current;
              
              console.log('Checking auto-listen conditions:', { 
                currentConversationActive, 
                currentDialogOpen, 
                currentStep: currentStepRef.current, 
                totalSteps: conversationSteps.length, 
                isListening 
              });
              
              // Check if we're still in conversation mode and dialog is open
              if (currentConversationActive && currentDialogOpen && currentStepRef.current < conversationSteps.length && !isListening) {
                console.log('✅ Starting auto-listen after speech end...');
                startListening();
              } else {
                console.log('❌ Skipping auto-listen - conditions not met');
              }
            }, 1000); // Increased delay for speech synthesis completion
          }
        };
        
        utterance.onerror = () => {
          if (!speechEnded) {
            speechEnded = true;
            console.log('Speech error, auto-starting listening...');
            setTimeout(() => {
              if (conversationActiveRef.current && dialogOpenRef.current && currentStepRef.current < conversationSteps.length && !isListening) {
                console.log('✅ Starting auto-listen after speech error...');
                startListening();
              }
            }, 500);
          }
        };
        
        // Fallback timeout in case speech events don't fire
        setTimeout(() => {
          if (!speechEnded) {
            speechEnded = true;
            console.log('Speech timeout, auto-starting listening...');
            if (conversationActiveRef.current && dialogOpenRef.current && currentStepRef.current < conversationSteps.length && !isListening) {
              console.log('✅ Starting auto-listen after speech timeout...');
              startListening();
            }
          }
        }, Math.max(text.length * 100, 2000)); // Estimate speech duration
      }
      
      window.speechSynthesis.speak(utterance);
    } else if (autoListen) {
      // If speech synthesis is not available, auto-start listening immediately
      console.log('No speech synthesis, starting listening immediately...');
      setTimeout(() => {
        if (conversationActiveRef.current && dialogOpenRef.current && currentStepRef.current < conversationSteps.length && !isListening) {
          console.log('✅ Starting auto-listen (no speech synthesis)...');
          startListening();
        }
      }, 500);
    }
  };

  // Find matching service
  const findService = (userInput: string) => {
    const input = userInput.toLowerCase().trim();
    console.log('🔍 findService called with:', input);
    
    // Service mapping for variations and Tamil words
    const serviceVariations: { [key: string]: string[] } = {
      'plumbing': ['plumber', 'plumbers', 'குழாய்', 'குழாய் பழுதுபார்ப்பு', 'பிளம்பர்'],
      'electrical': ['electrician', 'electricians', 'மின்சாரம்', 'மின்சார வேலை', 'எலக்ட்ரிசியன்'],
      'painting': ['painter', 'painters', 'paint', 'ஓவியம்', 'வண்ணம் அடிக்கும்', 'பெயிண்டர்'],
      'carpentry': ['carpenter', 'carpenters', 'wood work', 'மரவேலை', 'தச்சன்', 'கார்பென்டர்'],
      'ac repair': ['ac', 'air conditioner', 'cooling', 'ஏசி', 'குளிர்சாதன பெட்டி', 'ஏசி ரிப்பேர்'],
      'cleaning': ['cleaner', 'cleaners', 'housekeeping', 'சுத்தம்', 'சுத்தம் செய்யும்', 'க்ளீனிங்'],
      'mechanic': ['mechanics', 'auto repair', 'car repair', 'மெக்கானிக்', 'வாகன பழுதுபார்ப்பு'],
      'gardening': ['gardener', 'landscaping', 'garden', 'தோட்டக்கலை', 'தோட்டம்', 'கார்டனிங்']
    };
    
    const foundService = services.find(service => {
      const serviceName = service.name.toLowerCase();
      console.log('🔍 Checking service:', serviceName, 'against input:', input);
      
      // Direct match with service name
      if (serviceName.includes(input) || input.includes(serviceName)) {
        console.log('✅ Direct match found:', serviceName);
        return true;
      }
      
      // Tamil name match
      if (service.tamil_name && 
          (service.tamil_name.includes(input) || input.includes(service.tamil_name))) {
        console.log('✅ Tamil name match found:', service.tamil_name);
        return true;
      }
      
      // Check variations
      const variations = serviceVariations[serviceName] || [];
      const hasVariationMatch = variations.some(variation => {
        const match = variation.includes(input) || input.includes(variation);
        if (match) console.log('✅ Variation match found:', variation, 'for service:', serviceName);
        return match;
      });
      
      return hasVariationMatch;
    });
    
    console.log('🔍 findService result:', foundService);
    return foundService;
  };

  // Find matching district
  const findDistrict = (userInput: string) => {
    const input = userInput.toLowerCase().trim();
    
    return districts.find(district => {
      const englishMatch = district.name.toLowerCase().includes(input) || 
                          input.includes(district.name.toLowerCase());
      const tamilMatch = district.tamil_name && 
                        (district.tamil_name.includes(input) || input.includes(district.tamil_name));
      
      // Also check for partial matches and common variations
      const nameWords = district.name.toLowerCase().split(' ');
      const inputWords = input.split(' ');
      const hasPartialMatch = nameWords.some(word => 
        inputWords.some(inputWord => word.includes(inputWord) || inputWord.includes(word))
      );
      
      return englishMatch || tamilMatch || hasPartialMatch;
    });
  };

  // Process user response
  const processResponse = (transcript: string) => {
    const actualCurrentStep = currentStepRef.current; // Use ref for reliable step tracking
    const currentStepData = conversationSteps[actualCurrentStep];
    const input = transcript.toLowerCase().trim();
    
    console.log('🔄 processResponse called:', { transcript, actualCurrentStep, stepField: currentStepData.field });
    setConversation(prev => [...prev, `You: ${transcript}`]);

    switch (currentStepData.field) {
      case 'service':
        console.log('🔍 Looking for service:', input, '| Available services:', services.map(s => s.name));
        const foundService = findService(input);
        console.log('🔍 Found service:', foundService);
        if (foundService) {
          onServiceSelect(foundService.id);
          const response = `Great! I've selected ${foundService.name} service.`;
          setConversation(prev => [...prev, `Assistant: ${response}`]);
          speak(response, 'english', false);
          setTimeout(() => {
            console.log('🔄 Moving to step 1 (district selection)');
            setCurrentStep(1);
            currentStepRef.current = 1; // Update ref immediately
            const nextQuestion = conversationSteps[1].question.english;
            setConversation(prev => [...prev, `Assistant: ${nextQuestion}`]);
            speak(nextQuestion, 'english', true);
          }, 1500);
        } else {
          console.log('❌ Service not found for input:', input);
          const retry = "Sorry, I couldn't find that service. Try saying plumber, electrician, painter, carpenter, or mechanic.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, 'english', true);
        }
        break;

      case 'district':
        const foundDistrict = findDistrict(input);
        if (foundDistrict) {
          onDistrictSelect(foundDistrict.id);
          const response = `Great! I've selected ${foundDistrict.name} district.`;
          setConversation(prev => [...prev, `Assistant: ${response}`]);
          speak(response, 'english', false);
          setTimeout(() => {
            console.log('🔄 Moving to step 2 (description)');
            setCurrentStep(2);
            currentStepRef.current = 2; // Update ref immediately
            const nextQuestion = conversationSteps[2].question.english;
            setConversation(prev => [...prev, `Assistant: ${nextQuestion}`]);
            speak(nextQuestion, 'english', true);
          }, 1500);
        } else {
          const retry = "Sorry, I couldn't find that district. Try saying district names like Mumbai, Delhi, or Bangalore.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, 'english', true);
        }
        break;

      case 'description':
        onDescriptionUpdate(transcript);
        const response = "Great! I've recorded your service description. You can now proceed with the search.";
        setConversation(prev => [...prev, `Assistant: ${response}`]);
        speak(response, 'english', false);
        setTimeout(() => {
          console.log('✅ Conversation completed - closing dialog');
          setIsConversationActive(false);
          conversationActiveRef.current = false;
          dialogOpenRef.current = false;
          currentStepRef.current = 0;
          setIsOpen(false);
        }, 3000);
        return;
    }
  };

  // This function is no longer needed as we handle step transitions inline
  // but keeping it for any edge cases
  const askNextQuestion = () => {
    const nextStep = currentStep + 1;
    if (nextStep < conversationSteps.length) {
      setCurrentStep(nextStep);
      const stepData = conversationSteps[nextStep];
      const question = stepData.question.english;
      setConversation(prev => [...prev, `Assistant: ${question}`]);
      speak(question, 'english');
    }
  };

  // Start voice recognition
  const startListening = () => {
    if (!speechSupported) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      console.log('Already listening, skipping...', { isListening });
      return;
    }
    
    // Force dialog to stay open during conversation
    if (!isOpen && currentStepRef.current < conversationSteps.length - 1) {
      setIsOpen(true);
    }
    
    console.log('Starting voice recognition...', { isOpen, isListening, currentStep: currentStepRef.current, selectedLanguage });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    // Set recognition language based on current step and selected language
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    let finalTranscript = '';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Process final result
      if (finalTranscript.trim()) {
        console.log('🎤 Final voice recognition result:', finalTranscript, '| Current step:', currentStepRef.current);
        recognition.stop();
        setIsListening(false);
        processResponse(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.log('Voice recognition error:', event.error);
      setIsListening(false);
      
      // Only show error toast for significant errors, not for no-speech or aborted
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          title: "Voice recognition error",
          description: "Please try again",
          variant: "destructive",
        });
      }
      
      // Don't restart on aborted errors (user interaction)
      if (event.error === 'aborted') {
        console.log('Voice recognition aborted - user interaction detected');
        return;
      }
      
      // Auto-restart on some recoverable errors
      if (event.error === 'no-speech' && isConversationActive && isOpen && currentStepRef.current < conversationSteps.length) {
        setTimeout(() => {
          if (!isListening) {
            console.log('Restarting after no-speech error...');
            startListening();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Voice recognition ended', { finalTranscript, currentStep });
      setIsListening(false);
      
      // If no final transcript and still in conversation, restart listening
      if (!finalTranscript.trim() && isConversationActive && isOpen && currentStep < conversationSteps.length) {
        setTimeout(() => {
          if (!isListening) {
            console.log('Restarting listening - no response detected...');
            startListening();
          }
        }, 1000);
      }
    };

    try {
      console.log('About to call recognition.start()...');
      recognition.start();
      console.log('recognition.start() called successfully');
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setIsListening(false);
      
      // Retry after a short delay
      setTimeout(() => {
        if (isConversationActive && isOpen && currentStep < conversationSteps.length && !isListening) {
          console.log('Retrying voice recognition after error...');
          startListening();
        }
      }, 1000);
    }
  };

  // Start conversation
  const startConversation = () => {
    console.log('Starting conversation...');
    setIsOpen(true);
    setCurrentStep(0);
    setConversation([]);
    // Language is now fixed to English
    setIsConversationActive(true);
    
    // Update refs
    conversationActiveRef.current = true;
    dialogOpenRef.current = true;
    currentStepRef.current = 0;
    
    setTimeout(() => {
      console.log('Starting first question...');
      const question = conversationSteps[0].question.english;
      setConversation([`Assistant: ${question}`]);
      console.log('Speaking first question and setting up auto-listen...', { 
        conversationActive: conversationActiveRef.current, 
        dialogOpen: dialogOpenRef.current 
      });
      speak(question, 'english', true); // Auto-listen after question
    }, 500);
  };

  // Close conversation
  const closeConversation = (newOpen: boolean) => {
    if (!newOpen) {
      console.log('Closing conversation...');
      setIsConversationActive(false);
      setIsListening(false);
      setIsOpen(false);
      
      // Update refs
      conversationActiveRef.current = false;
      dialogOpenRef.current = false;
      currentStepRef.current = 0;
      
      // Stop any ongoing speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  if (!speechSupported) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={`text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-300 hover:border-purple-400 shadow-sm transition-all duration-200 ${className}`}
        onClick={startConversation}
        title="🎤 Voice Assistant - Interactive conversation in English"
      >
        <Volume2 className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={closeConversation}>
        <DialogContent className="max-w-md" aria-describedby="voice-assistant-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-purple-600" />
              Voice Assistant
            </DialogTitle>
          </DialogHeader>
          <p id="voice-assistant-description" className="sr-only">
            Interactive voice assistant to help you find services by speaking in English
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
              {conversation.map((message, index) => (
                <div key={index} className={`mb-2 ${message.startsWith('You:') ? 'text-blue-600' : 'text-gray-800'}`}>
                  {message}
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-center justify-center">
              {isListening ? (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="animate-pulse bg-red-500 w-3 h-3 rounded-full"></div>
                  <span className="font-medium">Listening...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Volume2 className="h-4 w-4" />
                  <span>Voice conversation in progress</span>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="ml-4 px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}