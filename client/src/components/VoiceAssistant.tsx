import { useState, useEffect } from "react";
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
  field: 'language' | 'service' | 'district' | 'description';
  question: {
    english: string;
    tamil: string;
  };
  expectedAnswers?: string[];
}

const conversationSteps: ConversationStep[] = [
  {
    step: 0,
    field: 'language',
    question: {
      english: "Would you like to continue in English or Tamil? Please say English or Tamil.",
      tamil: "நீங்கள் ஆங்கிலத்தில் அல்லது தமிழில் தொடர விரும்புகிறீர்களா? ஆங்கிலம் அல்லது தமிழ் என்று சொல்லுங்கள்."
    },
    expectedAnswers: ['english', 'tamil', 'ஆங்கிலம்', 'தமிழ்']
  },
  {
    step: 1,
    field: 'service',
    question: {
      english: "What type of service do you need? For example, say plumber, electrician, painter, or mechanic.",
      tamil: "உங்களுக்கு என்ன வகையான சேவை தேவை? உதாரணமாக, குழாய் பழுதுபார்ப்பவர், மின்சாரக் கொத்தனார், ஓவியர், அல்லது மெக்கானிக் என்று சொல்லுங்கள்."
    }
  },
  {
    step: 2,
    field: 'district',
    question: {
      english: "Which district are you in? Please say your district name.",
      tamil: "நீங்கள் எந்த மாவட்டத்தில் இருக்கிறீர்கள்? உங்கள் மாவட்டத்தின் பெயரைச் சொல்லுங்கள்."
    }
  },
  {
    step: 3,
    field: 'description',
    question: {
      english: "Please describe your service requirement in detail.",
      tamil: "உங்கள் சேவைத் தேவையை விரிவாக விவரிக்கவும்."
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
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'tamil'>('english');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [conversation, setConversation] = useState<string[]>([]);
  const { toast } = useToast();

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Text-to-speech function with auto-listen after speech
  const speak = (text: string, lang: string = 'en-US', autoListen: boolean = true) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'tamil' ? 'ta-IN' : 'en-US';
      utterance.rate = 0.8;
      
      // Auto-start listening after speech completes
      if (autoListen) {
        utterance.onend = () => {
          setTimeout(() => {
            if (isOpen && !isListening) {
              console.log('Auto-starting listening after speech...');
              startListening();
            }
          }, 800); // Increased delay to ensure speech has fully ended
        };
      }
      
      window.speechSynthesis.speak(utterance);
    } else if (autoListen) {
      // If speech synthesis is not available, still auto-start listening
      setTimeout(() => {
        if (isOpen && !isListening) {
          console.log('Auto-starting listening (no speech synthesis)...');
          startListening();
        }
      }, 1500);
    }
  };

  // Find matching service
  const findService = (userInput: string) => {
    const input = userInput.toLowerCase().trim();
    
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
    
    return services.find(service => {
      const serviceName = service.name.toLowerCase();
      
      // Direct match with service name
      if (serviceName.includes(input) || input.includes(serviceName)) {
        return true;
      }
      
      // Tamil name match
      if (service.tamil_name && 
          (service.tamil_name.includes(input) || input.includes(service.tamil_name))) {
        return true;
      }
      
      // Check variations
      const variations = serviceVariations[serviceName] || [];
      return variations.some(variation => 
        variation.includes(input) || input.includes(variation)
      );
    });
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
    const currentStepData = conversationSteps[currentStep];
    const input = transcript.toLowerCase().trim();
    
    setConversation(prev => [...prev, `You: ${transcript}`]);

    switch (currentStepData.field) {
      case 'language':
        if (input.includes('english') || input.includes('ஆங்கிலம்')) {
          setSelectedLanguage('english');
          setConversation(prev => [...prev, `Assistant: Great! Continuing in English.`]);
          speak("Great! Continuing in English.", 'english', false);
          setTimeout(() => {
            setCurrentStep(1);
            const nextQuestion = conversationSteps[1].question.english;
            setConversation(prev => [...prev, `Assistant: ${nextQuestion}`]);
            speak(nextQuestion, 'english', true);
          }, 2000);
        } else if (input.includes('tamil') || input.includes('தமிழ்')) {
          setSelectedLanguage('tamil');
          setConversation(prev => [...prev, `Assistant: சிறப்பு! தமிழில் தொடர்கிறோம்.`]);
          speak("சிறப்பு! தமிழில் தொடர்கிறோம்.", 'tamil', false);
          setTimeout(() => {
            setCurrentStep(1);
            const nextQuestion = conversationSteps[1].question.tamil;
            setConversation(prev => [...prev, `Assistant: ${nextQuestion}`]);
            speak(nextQuestion, 'tamil', true);
          }, 2000);
        } else {
          const retry = selectedLanguage === 'tamil' 
            ? "தயவுசெய்து ஆங்கிலம் அல்லது தமிழ் என்று சொல்லுங்கள்."
            : "Please say English or Tamil.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, selectedLanguage === 'tamil' ? 'tamil' : 'english', true);
        }
        break;

      case 'service':
        const foundService = findService(input);
        if (foundService) {
          onServiceSelect(foundService.id);
          const response = selectedLanguage === 'tamil' 
            ? `சிறப்பு! ${foundService.tamil_name || foundService.name} சேவையை தேர்வு செய்தேன்.`
            : `Great! I've selected ${foundService.name} service.`;
          setConversation(prev => [...prev, `Assistant: ${response}`]);
          speak(response, selectedLanguage === 'tamil' ? 'tamil' : 'english', false);
          setTimeout(() => {
            setCurrentStep(2);
            const nextQuestion = conversationSteps[2].question[selectedLanguage];
            setConversation(prev => [...prev, `Assistant: ${nextQuestion}`]);
            speak(nextQuestion, selectedLanguage === 'tamil' ? 'tamil' : 'english', true);
          }, 2000);
        } else {
          const retry = selectedLanguage === 'tamil' 
            ? "மன்னிக்கவும், அந்த சேவையை கண்டுபிடிக்க முடியவில்லை. குழாய், மின்சாரம், ஓவியம், அல்லது மரவேலை போன்ற சேவைகளைச் சொல்லுங்கள்."
            : "Sorry, I couldn't find that service. Try saying plumber, electrician, painter, carpenter, or mechanic.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, selectedLanguage === 'tamil' ? 'tamil' : 'english', true);
        }
        break;

      case 'district':
        const foundDistrict = findDistrict(input);
        if (foundDistrict) {
          onDistrictSelect(foundDistrict.id);
          const response = selectedLanguage === 'tamil' 
            ? `சிறப்பு! ${foundDistrict.tamil_name || foundDistrict.name} மாவட்டத்தை தேர்வு செய்தேன்.`
            : `Great! I've selected ${foundDistrict.name} district.`;
          setConversation(prev => [...prev, `Assistant: ${response}`]);
          speak(response, selectedLanguage === 'tamil' ? 'tamil' : 'english', false);
          setTimeout(() => {
            setCurrentStep(3);
            const nextQuestion = conversationSteps[3].question[selectedLanguage];
            setConversation(prev => [...prev, `Assistant: ${nextQuestion}`]);
            speak(nextQuestion, selectedLanguage === 'tamil' ? 'tamil' : 'english', true);
          }, 2000);
        } else {
          const retry = selectedLanguage === 'tamil' 
            ? "மன்னிக்கவும், அந்த மாவட்டத்தை கண்டுபிடிக்க முடியவில்லை. சென்னை, கோவை, மதுரை போன்ற மாவட்டப் பெயரைச் சொல்லுங்கள்."
            : "Sorry, I couldn't find that district. Try saying district names like Chennai, Coimbatore, or Madurai.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, selectedLanguage === 'tamil' ? 'tamil' : 'english', true);
        }
        break;

      case 'description':
        onDescriptionUpdate(transcript);
        const response = selectedLanguage === 'tamil' 
          ? "சிறப்பு! உங்கள் சேவை விவரணையை பதிவு செய்தேன். நீங்கள் இப்போது தேடலைத் தொடரலாம்."
          : "Great! I've recorded your service description. You can now proceed with the search.";
        setConversation(prev => [...prev, `Assistant: ${response}`]);
        speak(response, selectedLanguage === 'tamil' ? 'tamil' : 'english', false);
        setTimeout(() => setIsOpen(false), 3000);
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
      const question = stepData.question[selectedLanguage];
      setConversation(prev => [...prev, `Assistant: ${question}`]);
      speak(question, selectedLanguage === 'tamil' ? 'tamil' : 'english');
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

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    // Set recognition language based on current step and selected language
    recognition.lang = selectedLanguage === 'tamil' ? 'ta-IN' : 'en-US';
    
    // For the language selection step, use English initially
    if (currentStep === 0) {
      recognition.lang = 'en-US';
    }

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processResponse(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: "Voice recognition error",
        description: "Please try again",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Start conversation
  const startConversation = () => {
    setIsOpen(true);
    setCurrentStep(0);
    setConversation([]);
    setSelectedLanguage('english');
    
    setTimeout(() => {
      const question = conversationSteps[0].question.english;
      setConversation([`Assistant: ${question}`]);
      speak(question, 'english', true); // Auto-listen after question
      
      // Backup auto-listen in case speech synthesis doesn't work properly
      setTimeout(() => {
        if (!isListening) {
          console.log('Backup auto-starting listening...');
          startListening();
        }
      }, 3000);
    }, 500);
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
        title="🎤 Voice Assistant - Interactive conversation mode"
      >
        <Volume2 className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md" aria-describedby="voice-assistant-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-purple-600" />
              Voice Assistant
            </DialogTitle>
          </DialogHeader>
          <p id="voice-assistant-description" className="sr-only">
            Interactive voice assistant to help you find services by speaking in English or Tamil
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