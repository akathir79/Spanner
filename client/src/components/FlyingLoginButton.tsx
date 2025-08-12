import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlyingLoginButtonProps {
  show: boolean;
  onComplete: () => void;
  onLoginClick: () => void;
}

export function FlyingLoginButton({ show, onComplete, onLoginClick }: FlyingLoginButtonProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (show) {
      // Track mouse position when button should show
      window.addEventListener("mousemove", handleMouseMove);
      setIsAnimating(true);
      
      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 5000);
      
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        clearTimeout(timer);
      };
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && isAnimating && (
        <motion.div
          ref={buttonRef}
          initial={{ 
            x: window.innerWidth / 2 - 100,
            y: -100,
            scale: 0.5,
            opacity: 0 
          }}
          animate={{
            x: mousePosition.x - 100,
            y: mousePosition.y - 50,
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
            damping: 25,
            stiffness: 200,
            mass: 1,
            duration: 1.5
          }}
          className="fixed z-[100000] pointer-events-none"
          style={{ pointerEvents: "none" }}
        >
          <div className="relative pointer-events-auto">
            {/* Sparkle effects */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="absolute -inset-4"
            >
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -left-2" />
              <Sparkles className="w-4 h-4 text-blue-400 absolute -bottom-1 -right-1" />
              <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-2" />
            </motion.div>

            {/* Glowing effect */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                  "0 0 40px rgba(59, 130, 246, 0.8)",
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="rounded-lg"
            >
              <Button
                onClick={onLoginClick}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-8 py-6 rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
                style={{ pointerEvents: "auto" }}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Login Now
              </Button>
            </motion.div>

            {/* Floating text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            >
              <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full shadow-md">
                Click to login with your credentials
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}