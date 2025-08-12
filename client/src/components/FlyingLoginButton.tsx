import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlyingLoginButtonProps {
  show: boolean;
  onComplete: () => void;
  onLoginClick: () => void;
}

export function FlyingLoginButton({ show, onComplete, onLoginClick }: FlyingLoginButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleLoginClick = () => {
    handleClose();
    onLoginClick();
  };

  return (
    <AnimatePresence>
      {show && isVisible && (
        <motion.div
          ref={buttonRef}
          initial={{ 
            scale: 0,
            opacity: 0 
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          exit={{
            scale: 0,
            opacity: 0,
            transition: { duration: 0.3 }
          }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 300,
            duration: 0.5
          }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100000]"
        >
          <div className="relative">
            {/* Close button */}
            <Button
              onClick={handleClose}
              size="sm"
              variant="ghost"
              className="absolute -top-2 -right-2 rounded-full bg-white shadow-md hover:bg-gray-100 p-1 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Blinking effect container */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [1, 0.9, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="relative"
            >
              {/* Glowing background effect */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(59, 130, 246, 0.3)",
                    "0 0 60px rgba(59, 130, 246, 0.6)",
                    "0 0 30px rgba(59, 130, 246, 0.3)",
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 rounded-lg"
              />

              {/* Main login button with blinking */}
              <Button
                onClick={handleLoginClick}
                size="lg"
                className="relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-10 py-7 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <motion.div
                  animate={{
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="flex items-center gap-3"
                >
                  <LogIn className="h-6 w-6" />
                  <span className="text-lg">Login Now</span>
                </motion.div>
              </Button>
            </motion.div>

            {/* Floating text with arrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: [0, -5, 0]
              }}
              transition={{ 
                y: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                },
                opacity: {
                  delay: 0.3
                }
              }}
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-2xl">👆</div>
                <span className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-full shadow-lg">
                  Click to login with your credentials
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}