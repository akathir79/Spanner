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

  // Text-to-speech function
  const speak = (text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'tamil' ? 'ta-IN' : 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Find matching service
  const findService = (userInput: string) => {
    const input = userInput.toLowerCase().trim();
    return services.find(service => {
      const englishMatch = service.name.toLowerCase().includes(input) || 
                          input.includes(service.name.toLowerCase());
      const tamilMatch = service.tamil_name && 
                        (service.tamil_name.includes(input) || input.includes(service.tamil_name));
      return englishMatch || tamilMatch;
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
      return englishMatch || tamilMatch;
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
          speak("Great! Continuing in English.");
          setTimeout(() => askNextQuestion(), 2000);
        } else if (input.includes('tamil') || input.includes('தமிழ்')) {
          setSelectedLanguage('tamil');
          setConversation(prev => [...prev, `Assistant: சிறப்பு! தமிழில் தொடர்கிறோம்.`]);
          speak("சிறப்பு! தமிழில் தொடர்கிறோம்.", 'tamil');
          setTimeout(() => askNextQuestion(), 2000);
        } else {
          const retry = selectedLanguage === 'tamil' 
            ? "தயவுசெய்து ஆங்கிலம் அல்லது தமிழ் என்று சொல்லுங்கள்."
            : "Please say English or Tamil.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, selectedLanguage === 'tamil' ? 'tamil' : 'english');
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
          speak(response, selectedLanguage === 'tamil' ? 'tamil' : 'english');
          setTimeout(() => askNextQuestion(), 2000);
        } else {
          const retry = selectedLanguage === 'tamil' 
            ? "மன்னிக்கவும், அந்த சேவையை கண்டுபிடிக்க முடியவில்லை. தயவுசெய்து மீண்டும் சொல்லுங்கள் அல்லது டைப் செய்யுங்கள்."
            : "Sorry, I couldn't find that service. Please try again or type your answer.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, selectedLanguage === 'tamil' ? 'tamil' : 'english');
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
          speak(response, selectedLanguage === 'tamil' ? 'tamil' : 'english');
          setTimeout(() => askNextQuestion(), 2000);
        } else {
          const retry = selectedLanguage === 'tamil' 
            ? "மன்னிக்கவும், அந்த மாவட்டத்தை கண்டுபிடிக்க முடியவில்லை. தயவுசெய்து மீண்டும் சொல்லுங்கள் அல்லது டைப் செய்யுங்கள்."
            : "Sorry, I couldn't find that district. Please try again or type your answer.";
          setConversation(prev => [...prev, `Assistant: ${retry}`]);
          speak(retry, selectedLanguage === 'tamil' ? 'tamil' : 'english');
        }
        break;

      case 'description':
        onDescriptionUpdate(transcript);
        const response = selectedLanguage === 'tamil' 
          ? "சிறப்பு! உங்கள் சேவை விவரணையை பதிவு செய்தேன். நீங்கள் இப்போது தேடலைத் தொடரலாம்."
          : "Great! I've recorded your service description. You can now proceed with the search.";
        setConversation(prev => [...prev, `Assistant: ${response}`]);
        speak(response, selectedLanguage === 'tamil' ? 'tamil' : 'english');
        setTimeout(() => setIsOpen(false), 3000);
        return;
    }
  };

  // Ask next question
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
    recognition.lang = selectedLanguage === 'tamil' ? 'ta-IN' : 'en-US';

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
    
    setTimeout(() => {
      const question = conversationSteps[0].question.english;
      setConversation([`Assistant: ${question}`]);
      speak(question);
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-purple-600" />
              Voice Assistant
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
              {conversation.map((message, index) => (
                <div key={index} className={`mb-2 ${message.startsWith('You:') ? 'text-blue-600' : 'text-gray-800'}`}>
                  {message}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={startListening}
                disabled={isListening}
                className={`flex-1 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Speak
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
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