import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlyingLoginButtonProps {
  show: boolean;
  onComplete: () => void;
  onLoginClick: () => void;
}

export function FlyingLoginButton({ show, onComplete, onLoginClick }: FlyingLoginButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (show) {
      setIsVisible(true);
      window.addEventListener("mousemove", handleMouseMove);
      
      // Auto-hide after 20 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 20000);
      
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
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

  // Calculate subtle cursor-following offset (limited range)
  const offsetX = (mousePosition.x - window.innerWidth / 2) * 0.02;
  const offsetY = (mousePosition.y - window.innerHeight / 2) * 0.02;

  return (
    <AnimatePresence>
      {show && isVisible && (
        <motion.div
          ref={buttonRef}
          initial={{ 
            scale: 0,
            opacity: 0,
            y: -100
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            x: offsetX,
            translateY: offsetY
          }}
          exit={{
            scale: 0,
            opacity: 0,
            y: 50,
            transition: { duration: 0.3 }
          }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 260,
            mass: 1,
            duration: 0.8
          }}
          className="fixed top-[65%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100000]"
        >
          <div className="relative">
            {/* Close button */}
            <Button
              onClick={handleClose}
              size="sm"
              variant="ghost"
              className="absolute -top-3 -right-3 rounded-full bg-white shadow-lg hover:bg-gray-100 p-1.5 h-7 w-7 z-10"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>

            {/* Sparkle effects */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -inset-8 pointer-events-none"
            >
              <Sparkles className="w-6 h-6 text-yellow-400 absolute top-0 left-0 animate-pulse" />
              <Sparkles className="w-5 h-5 text-blue-400 absolute bottom-0 right-0 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <Sparkles className="w-7 h-7 text-purple-400 absolute top-0 right-0 animate-pulse" style={{ animationDelay: "1s" }} />
              <Sparkles className="w-4 h-4 text-pink-400 absolute bottom-0 left-0 animate-pulse" style={{ animationDelay: "1.5s" }} />
            </motion.div>

            {/* Pulsing glow container */}
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="relative"
            >
              {/* Multi-layered glowing effect */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)",
                    "0 0 40px rgba(147, 51, 234, 0.5), 0 0 80px rgba(59, 130, 246, 0.3)",
                    "0 0 20px rgba(147, 51, 234, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)",
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 rounded-xl"
              />

              {/* Main login button with enhanced gradient */}
              <Button
                onClick={handleLoginClick}
                size="lg"
                className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white font-bold px-12 py-8 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200 border-2 border-white/20"
              >
                <motion.div
                  animate={{
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="flex items-center gap-3"
                >
                  <LogIn className="h-7 w-7" />
                  <span className="text-xl font-bold tracking-wide">Login Now</span>
                </motion.div>
              </Button>
            </motion.div>

            {/* Floating helper text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: [10, 5, 10]
              }}
              transition={{ 
                y: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                },
                opacity: {
                  delay: 0.5
                }
              }}
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-3xl"
                >
                  ☝️
                </motion.div>
                <span className="text-sm font-semibold text-gray-800 bg-gradient-to-r from-yellow-100 to-blue-100 px-5 py-2.5 rounded-full shadow-xl border border-white/50">
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