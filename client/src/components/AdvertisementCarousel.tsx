import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Advertisement {
  id: string;
  title: string;
  description?: string;
  image?: string;
  targetAudience: string;
  link?: string;
  buttonText?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
}

interface AdvertisementCarouselProps {
  targetAudience: "client" | "worker";
}

export default function AdvertisementCarousel({ targetAudience }: AdvertisementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fetch active advertisements for the target audience
  const { data: advertisements = [], isLoading } = useQuery({
    queryKey: [`/api/advertisements/active/${targetAudience}`],
    refetchInterval: 30000, // Refresh every 30 seconds to get latest ads
  });

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying || advertisements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, advertisements.length]);

  // Add transition effect when index changes
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => 
      prev === 0 ? advertisements.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => 
      (prev + 1) % advertisements.length
    );
  };

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  if (isLoading) {
    return (
      <Card className="w-full h-48 animate-pulse bg-gradient-to-r from-purple-400 to-pink-400">
        <CardContent className="p-0 h-full flex items-center justify-center">
          <div className="text-white">Loading advertisements...</div>
        </CardContent>
      </Card>
    );
  }

  if (advertisements.length === 0) {
    // Default promotional content when no ads are available
    return (
      <Card 
        className="w-full overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">
                Welcome to SPANNER!
              </h3>
              <p className="text-white/90 mb-4">
                Your trusted platform for all service needs across India
              </p>
            </div>
            <div className="flex gap-4">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">🎉</div>
                    <h4 className="font-semibold text-white text-sm">New Year Special!</h4>
                    <p className="text-white/80 text-xs mt-1">Get 20% off on your first booking of 2025</p>
                    <Button 
                      size="sm" 
                      className="mt-2 bg-white text-purple-700 hover:bg-white/90"
                    >
                      Claim Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-3xl mb-1">💰</div>
                    <h4 className="font-semibold text-white text-sm">Refer & Earn</h4>
                    <p className="text-white/80 text-xs mt-1">Earn ₹100 for every friend who books a service</p>
                    <Button 
                      size="sm" 
                      className="mt-2 bg-white text-purple-700 hover:bg-white/90"
                    >
                      Start Referring
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentAd = advertisements[currentIndex];

  return (
    <div 
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card 
        className={`w-full overflow-hidden transition-all duration-500 ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{
          background: currentAd.backgroundColor || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            {/* Left content */}
            <div className="flex-1">
              <h3 
                className="text-2xl font-bold mb-2"
                style={{ color: currentAd.textColor || "#ffffff" }}
              >
                {currentAd.title}
              </h3>
              {currentAd.description && (
                <p 
                  className="mb-4 opacity-90"
                  style={{ color: currentAd.textColor || "#ffffff" }}
                >
                  {currentAd.description}
                </p>
              )}
              {currentAd.link && (
                <Button
                  onClick={() => window.open(currentAd.link, '_blank')}
                  className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
                  style={{ 
                    color: currentAd.textColor || "#ffffff",
                    borderColor: currentAd.textColor || "#ffffff"
                  }}
                >
                  {currentAd.buttonText || "Learn More"}
                </Button>
              )}
            </div>

            {/* Right content - Image or promotional cards */}
            {currentAd.image ? (
              <div className="w-1/3">
                <img 
                  src={currentAd.image} 
                  alt={currentAd.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="flex gap-4">
                <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-3xl mb-1">🎉</div>
                      <h4 
                        className="font-semibold text-sm"
                        style={{ color: currentAd.textColor || "#ffffff" }}
                      >
                        Special Offer!
                      </h4>
                      <p 
                        className="text-xs mt-1 opacity-80"
                        style={{ color: currentAd.textColor || "#ffffff" }}
                      >
                        Limited time only
                      </p>
                      {currentAd.link && (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.open(currentAd.link, '_blank')}
                          style={{
                            backgroundColor: currentAd.textColor || "#ffffff",
                            color: currentAd.backgroundColor?.includes('gradient') 
                              ? "#764ba2" 
                              : currentAd.backgroundColor || "#764ba2"
                          }}
                        >
                          Claim Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation arrows */}
      {advertisements.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 z-10"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" style={{ color: currentAd.textColor || "#ffffff" }} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 z-10"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" style={{ color: currentAd.textColor || "#ffffff" }} />
          </Button>

          {/* Ad counter */}
          <div 
            className="absolute top-4 right-4 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-xs font-medium"
            style={{ color: currentAd.textColor || "#ffffff" }}
          >
            {currentIndex + 1} / {advertisements.length}
          </div>

          {/* Dots indicator with progress bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {advertisements.map((_: Advertisement, index: number) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`relative h-2 rounded-full transition-all duration-300 overflow-hidden ${
                  index === currentIndex 
                    ? "w-12 bg-white/30" 
                    : "w-2 bg-white/50 hover:bg-white/70"
                }`}
              >
                {index === currentIndex && isAutoPlaying && (
                  <div 
                    className="absolute inset-0 bg-white animate-progress"
                    style={{
                      animation: 'progress 5s linear forwards'
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}