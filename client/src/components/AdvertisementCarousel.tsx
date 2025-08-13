import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Advertisement {
  id: string;
  title?: string;
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
  displayMode?: 'text' | 'image-only' | 'mixed';
}

interface AdvertisementCarouselProps {
  targetAudience: "client" | "worker";
}

export default function AdvertisementCarousel({ targetAudience }: AdvertisementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(true);

  // Fetch global advertisement toggle state
  useEffect(() => {
    const fetchAdToggle = async () => {
      try {
        const response = await fetch('/api/settings/advertisement-toggle');
        const data = await response.json();
        setAdsEnabled(data.enabled);
      } catch (error) {
        console.error('Error fetching advertisement toggle:', error);
      }
    };
    fetchAdToggle();
  }, []);

  // Fetch active advertisements for the target audience
  const { data: advertisements = [], isLoading } = useQuery<Advertisement[]>({
    queryKey: [`/api/advertisements/active/${targetAudience}`],
    refetchInterval: 30000, // Refresh every 30 seconds to get latest ads
    enabled: adsEnabled, // Only fetch if ads are enabled
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

  // Show white space when ads are disabled
  if (!adsEnabled) {
    return <div className="h-32" />; // Empty white space
  }

  if (isLoading) {
    return (
      <Card className="w-full animate-pulse bg-gradient-to-r from-purple-400 to-pink-400" style={{ minHeight: '200px', maxHeight: '400px' }}>
        <CardContent className="p-0 h-full flex items-center justify-center" style={{ minHeight: '200px' }}>
          <div className="text-white">Loading advertisements...</div>
        </CardContent>
      </Card>
    );
  }

  if (advertisements.length === 0) {
    // Return nothing when no ads are available
    return null;
  }

  const currentAd = advertisements[currentIndex];
  const displayMode = currentAd.displayMode || 'mixed';

  // Render image-only advertisement
  if (displayMode === 'image-only' && currentAd.image) {
    return (
      <div 
        className="relative w-full group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Card className={`w-full overflow-hidden transition-all duration-500 ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          <div className="relative w-full" style={{ minHeight: '200px', maxHeight: '400px' }}>
            <img 
              src={currentAd.image} 
              alt={currentAd.title || "Advertisement"}
              className="w-full h-auto object-contain"
              style={{ minHeight: '200px', maxHeight: '400px' }}
              loading="eager"
            />
            {/* Optional overlay button */}
            {currentAd.link && currentAd.buttonText && (
              <div className="absolute bottom-4 left-4">
                <Button
                  onClick={() => window.open(currentAd.link, '_blank')}
                  className="bg-white/90 text-gray-900 hover:bg-white shadow-lg"
                  size="lg"
                >
                  {currentAd.buttonText}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Navigation for image-only mode */}
        {advertisements.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {advertisements.map((_: Advertisement, index: number) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Render text-only or mixed mode advertisement
  return (
    <div 
      className="relative w-full group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card 
        className={`w-full overflow-hidden transition-all duration-500 ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{
          background: currentAd.backgroundColor || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: displayMode === 'text' ? '180px' : '200px',
          maxHeight: '400px'
        }}
      >
        <CardContent className="p-8 h-full">
          <div className="flex items-center justify-between gap-6 h-full">
            {/* Left content */}
            <div className="flex-1 flex flex-col justify-center">
              {currentAd.title && (
                <h3 
                  className="text-2xl md:text-3xl font-bold mb-3"
                  style={{ color: currentAd.textColor || "#ffffff" }}
                >
                  {currentAd.title}
                </h3>
              )}
              {currentAd.description && (
                <p 
                  className="text-base md:text-lg mb-6 opacity-90"
                  style={{ color: currentAd.textColor || "#ffffff" }}
                >
                  {currentAd.description}
                </p>
              )}
              {currentAd.link && (
                <Button
                  onClick={() => window.open(currentAd.link, '_blank')}
                  className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 w-fit"
                  size="lg"
                  style={{ 
                    color: currentAd.textColor || "#ffffff",
                    borderColor: currentAd.textColor || "#ffffff"
                  }}
                >
                  {currentAd.buttonText || "Learn More"}
                </Button>
              )}
            </div>

            {/* Right content - Image if in mixed mode */}
            {displayMode === 'mixed' && currentAd.image && (
              <div className="w-2/5 flex items-center">
                <img 
                  src={currentAd.image} 
                  alt={currentAd.title || "Advertisement"}
                  className="w-full h-auto object-contain rounded-lg"
                  style={{ maxHeight: '300px', minHeight: '150px' }}
                  loading="eager"
                />
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
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" style={{ color: currentAd.textColor || "#ffffff" }} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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