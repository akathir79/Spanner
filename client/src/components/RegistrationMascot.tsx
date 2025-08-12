import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  X, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Heart
} from "lucide-react";

interface MascotMessage {
  id: string;
  text: string;
  type: "welcome" | "instruction" | "encouragement" | "success" | "tip" | "error";
  step?: string;
  autoHide?: boolean;
  duration?: number;
}

interface RegistrationMascotProps {
  currentStep: "role-selection" | "personal-info" | "contact-info" | "location" | "completion";
  userRole?: "client" | "worker";
  hasErrors?: boolean;
  onClose?: () => void;
  isVisible?: boolean;
}

const mascotMessages: Record<string, MascotMessage[]> = {
  "role-selection": [
    {
      id: "welcome",
      type: "welcome",
      text: "Hi there! I'm Sparky, your SPANNER guide! 🔧 Let's get you registered in just a few easy steps. First, are you looking for services or providing them?"
    },
    {
      id: "role-tip",
      type: "tip",
      text: "💡 Tip: Clients can find and book services, while Workers can offer their skills and earn money!"
    }
  ],
  "personal-info": [
    {
      id: "personal-start",
      type: "instruction",
      text: "Great choice! Now let's get your basic info. Don't worry, you can always update your profile later."
    },
    {
      id: "name-tip",
      type: "tip",
      text: "📝 Your first name helps build trust with other users. Use your real name for the best experience!"
    }
  ],
  "contact-info": [
    {
      id: "contact-start",
      type: "instruction",
      text: "Perfect! Now I need your mobile number. This helps keep your account secure and lets others contact you for services."
    },
    {
      id: "mobile-tip",
      type: "tip",
      text: "📱 We'll send you a quick verification code to make sure this number is yours."
    }
  ],
  "location": [
    {
      id: "location-start",
      type: "instruction",
      text: "Almost done! Let's set your location so we can connect you with nearby services. You can use auto-detect or enter it manually."
    },
    {
      id: "location-tip",
      type: "tip",
      text: "📍 Accurate location helps match you with the closest workers and fastest service!"
    }
  ],
  "completion": [
    {
      id: "success",
      type: "success",
      text: "🎉 Fantastic! You're all set up! Welcome to the SPANNER community. You can now start exploring services or manage your profile."
    },
    {
      id: "next-steps",
      type: "encouragement",
      text: "💪 Ready to get started? Check out your dashboard to complete your profile and unlock all features!"
    }
  ]
};

const errorMessages: MascotMessage[] = [
  {
    id: "error-help",
    type: "error",
    text: "Oops! Looks like something needs attention. Don't worry, I'm here to help! Please check the highlighted fields."
  },
  {
    id: "error-tip",
    type: "tip",
    text: "💡 Double-check that your mobile number includes the area code and your location details are complete."
  }
];

const encouragementMessages: MascotMessage[] = [
  {
    id: "progress",
    type: "encouragement",
    text: "You're doing great! Just a few more steps to go!"
  },
  {
    id: "almost-there",
    type: "encouragement",
    text: "Almost there! You're just moments away from joining SPANNER!"
  },
  {
    id: "keep-going",
    type: "encouragement",
    text: "Keep it up! Each step gets you closer to amazing services!"
  }
];

export function RegistrationMascot({ 
  currentStep, 
  userRole, 
  hasErrors = false, 
  onClose,
  isVisible = true 
}: RegistrationMascotProps) {
  const [currentMessage, setCurrentMessage] = useState<MascotMessage | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Debug logging
  console.log("RegistrationMascot render:", { currentStep, userRole, hasErrors, isVisible });

  // Mascot SVG character
  const MascotCharacter = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative"
    >
      <svg width="60" height="60" viewBox="0 0 100 100" className="drop-shadow-lg">
        {/* Body */}
        <ellipse cx="50" cy="70" rx="25" ry="20" fill="#4f46e5" />
        
        {/* Head */}
        <circle cx="50" cy="35" r="20" fill="#fbbf24" />
        
        {/* Eyes */}
        <motion.g
          animate={{ 
            scaleY: [1, 0.1, 1],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <circle cx="43" cy="30" r="3" fill="#1f2937" />
          <circle cx="57" cy="30" r="3" fill="#1f2937" />
        </motion.g>
        
        {/* Smile */}
        <path 
          d="M 40 40 Q 50 48 60 40" 
          stroke="#1f2937" 
          strokeWidth="2" 
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Tool (wrench) */}
        <motion.g
          animate={{ 
            rotate: [0, 10, -10, 0],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <rect x="70" y="25" width="3" height="15" fill="#6b7280" rx="1" />
          <rect x="68" y="23" width="7" height="3" fill="#6b7280" rx="1" />
          <rect x="68" y="38" width="7" height="3" fill="#6b7280" rx="1" />
        </motion.g>
        
        {/* Arms */}
        <ellipse cx="30" cy="55" rx="8" ry="15" fill="#fbbf24" transform="rotate(-20 30 55)" />
        <ellipse cx="70" cy="55" rx="8" ry="15" fill="#fbbf24" transform="rotate(20 70 55)" />
        
        {/* Highlight */}
        <ellipse cx="45" cy="28" rx="3" ry="2" fill="#ffffff" opacity="0.6" />
      </svg>
      
      {/* Floating sparkles */}
      <motion.div
        className="absolute -top-2 -right-2"
        animate={{ 
          y: [-5, 5, -5],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          repeatType: "loop"
        }}
      >
        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
      </motion.div>
      
      <motion.div
        className="absolute -bottom-1 -left-1"
        animate={{ 
          y: [3, -3, 3],
          rotate: [360, 180, 0]
        }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          repeatType: "loop",
          delay: 1
        }}
      >
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
      </motion.div>
    </motion.div>
  );

  // Get message icon based on type
  const getMessageIcon = (type: MascotMessage['type']) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "tip":
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case "encouragement":
        return <Heart className="w-4 h-4 text-pink-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  // Update message based on current step
  useEffect(() => {
    if (!isVisible) return;

    if (hasErrors) {
      setCurrentMessage(errorMessages[0]);
      return;
    }

    const stepMessages = mascotMessages[currentStep];
    if (stepMessages && stepMessages.length > 0) {
      // Always show the first message for the current step
      setCurrentMessage(stepMessages[0]);
      setMessageIndex(0);
    }
  }, [currentStep, hasErrors, isVisible]);

  // Auto-advance messages (simplified)
  useEffect(() => {
    if (!currentMessage || isMinimized) return;

    const timer = setTimeout(() => {
      const stepMessages = mascotMessages[currentStep];
      if (stepMessages && messageIndex < stepMessages.length - 1) {
        setMessageIndex(prev => prev + 1);
        setCurrentMessage(stepMessages[messageIndex + 1]);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentMessage, currentStep, messageIndex, isMinimized]);

  if (!isVisible) return null;

  // Super simple, guaranteed visible version
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 9999999,
        width: '280px',
        backgroundColor: '#ffffff',
        border: '3px solid #3b82f6',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        padding: '16px',
        opacity: 1,
        pointerEvents: 'auto',
        transform: 'translateZ(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ fontSize: '24px' }}>🔧</div>
        <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px', fontWeight: 'bold' }}>
          Hi! I'm Sparky 
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.4' }}>
          {currentMessage ? currentMessage.text : "Welcome to SPANNER! I'm here to guide you through registration. Let's get started! 🚀"}
        </p>
      </div>
      
      {/* Simple progress bar */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {["role-selection", "personal-info", "contact-info", "location", "completion"].map((step, index) => {
          const stepIndex = ["role-selection", "personal-info", "contact-info", "location", "completion"].indexOf(currentStep);
          return (
            <div
              key={step}
              style={{
                height: '4px',
                flex: 1,
                borderRadius: '2px',
                backgroundColor: index <= stepIndex ? '#3b82f6' : '#e5e7eb'
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Hook for easy integration with registration forms
export function useRegistrationMascot() {
  const [mascotStep, setMascotStep] = useState<RegistrationMascotProps['currentStep']>("role-selection");
  const [mascotVisible, setMascotVisible] = useState(true);
  const [hasErrors, setHasErrors] = useState(false);

  const updateStep = (step: RegistrationMascotProps['currentStep']) => {
    setMascotStep(step);
    setHasErrors(false);
  };

  const showError = () => {
    setHasErrors(true);
    setTimeout(() => setHasErrors(false), 5000);
  };

  const hideMascot = () => setMascotVisible(false);
  const showMascot = () => setMascotVisible(true);

  return {
    mascotStep,
    mascotVisible,
    hasErrors,
    updateStep,
    showError,
    hideMascot,
    showMascot
  };
}