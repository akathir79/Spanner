import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, TrendingUp, Users, Briefcase, Filter, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JobLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  jobCount: number;
  averageRate: number;
  category: string;
  district: string;
  timestamp: Date;
}

interface HeatMapProps {
  height?: number;
  autoPlay?: boolean;
}

export function JobMarketHeatMap({ height = 500, autoPlay = true }: HeatMapProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [visiblePins, setVisiblePins] = useState<Set<string>>(new Set());

  // Mock job location data with realistic Chennai areas
  const jobLocations: JobLocation[] = useMemo(() => [
    // High density areas
    { id: "1", name: "T. Nagar", x: 45, y: 55, jobCount: 125, averageRate: 850, category: "plumbing", district: "Chennai", timestamp: new Date(Date.now() - 5000) },
    { id: "2", name: "Anna Nagar", x: 35, y: 25, jobCount: 98, averageRate: 920, category: "electrical", district: "Chennai", timestamp: new Date(Date.now() - 4500) },
    { id: "3", name: "Velachery", x: 55, y: 75, jobCount: 87, averageRate: 780, category: "painting", district: "Chennai", timestamp: new Date(Date.now() - 4000) },
    { id: "4", name: "Adyar", x: 65, y: 65, jobCount: 76, averageRate: 950, category: "carpentry", district: "Chennai", timestamp: new Date(Date.now() - 3500) },
    
    // Medium density areas
    { id: "5", name: "Mylapore", x: 50, y: 60, jobCount: 65, averageRate: 820, category: "cleaning", district: "Chennai", timestamp: new Date(Date.now() - 3000) },
    { id: "6", name: "Nungambakkam", x: 40, y: 45, jobCount: 58, averageRate: 890, category: "plumbing", district: "Chennai", timestamp: new Date(Date.now() - 2500) },
    { id: "7", name: "Guindy", x: 60, y: 70, jobCount: 52, averageRate: 760, category: "electrical", district: "Chennai", timestamp: new Date(Date.now() - 2000) },
    { id: "8", name: "Porur", x: 25, y: 40, jobCount: 48, averageRate: 720, category: "ac_repair", district: "Chennai", timestamp: new Date(Date.now() - 1500) },
    
    // Lower density areas
    { id: "9", name: "Tambaram", x: 45, y: 85, jobCount: 35, averageRate: 680, category: "cleaning", district: "Chennai", timestamp: new Date(Date.now() - 1000) },
    { id: "10", name: "Chromepet", x: 50, y: 80, jobCount: 32, averageRate: 700, category: "painting", district: "Chennai", timestamp: new Date(Date.now() - 500) },
    { id: "11", name: "Perungudi", x: 70, y: 65, jobCount: 28, averageRate: 740, category: "carpentry", district: "Chennai", timestamp: new Date() },
    { id: "12", name: "Sholinganallur", x: 75, y: 70, jobCount: 24, averageRate: 710, category: "ac_repair", district: "Chennai", timestamp: new Date(Date.now() + 500) },
  ], []);

  // Filter locations based on selected filters
  const filteredLocations = useMemo(() => {
    return jobLocations.filter(location => {
      const districtMatch = selectedDistrict === "all" || location.district === selectedDistrict;
      const categoryMatch = selectedCategory === "all" || location.category === selectedCategory;
      return districtMatch && categoryMatch;
    });
  }, [jobLocations, selectedDistrict, selectedCategory]);

  // Get heat intensity color based on job count
  const getHeatColor = (jobCount: number) => {
    const maxJobs = Math.max(...jobLocations.map(l => l.jobCount));
    const intensity = jobCount / maxJobs;
    
    if (intensity > 0.8) return "bg-red-500";
    if (intensity > 0.6) return "bg-orange-500"; 
    if (intensity > 0.4) return "bg-yellow-500";
    if (intensity > 0.2) return "bg-green-500";
    return "bg-blue-500";
  };

  // Get pin size based on job count
  const getPinSize = (jobCount: number) => {
    const maxJobs = Math.max(...jobLocations.map(l => l.jobCount));
    const intensity = jobCount / maxJobs;
    
    if (intensity > 0.8) return "w-6 h-6";
    if (intensity > 0.6) return "w-5 h-5";
    if (intensity > 0.4) return "w-4 h-4";
    return "w-3 h-3";
  };

  // Animation effect for progressive pin drops
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + animationSpeed;
        const maxTime = Math.max(...filteredLocations.map(l => l.timestamp.getTime()));
        return next > maxTime ? 0 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, animationSpeed, filteredLocations]);

  // Update visible pins based on current time
  useEffect(() => {
    const now = Date.now() - (filteredLocations.length * animationSpeed) + currentTime;
    const newVisiblePins = new Set<string>();
    
    filteredLocations.forEach(location => {
      if (location.timestamp.getTime() <= now) {
        newVisiblePins.add(location.id);
      }
    });
    
    setVisiblePins(newVisiblePins);
  }, [currentTime, filteredLocations, animationSpeed]);

  const totalJobs = filteredLocations.reduce((sum, location) => sum + location.jobCount, 0);
  const averageRate = Math.round(filteredLocations.reduce((sum, location) => sum + location.averageRate, 0) / filteredLocations.length);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Job Market Heat Map
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="button-toggle-animation"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3 mr-1" />
              {totalJobs} Jobs
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              ₹{averageRate} Avg
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-32" data-testid="select-district">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              <SelectItem value="Chennai">Chennai</SelectItem>
              <SelectItem value="Coimbatore">Coimbatore</SelectItem>
              <SelectItem value="Madurai">Madurai</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32" data-testid="select-category">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="painting">Painting</SelectItem>
              <SelectItem value="carpentry">Carpentry</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="ac_repair">AC Repair</SelectItem>
            </SelectContent>
          </Select>

          <Select value={animationSpeed.toString()} onValueChange={(value) => setAnimationSpeed(Number(value))}>
            <SelectTrigger className="w-32" data-testid="select-speed">
              <SelectValue placeholder="Speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2000">Slow</SelectItem>
              <SelectItem value="1000">Normal</SelectItem>
              <SelectItem value="500">Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Heat Map Container */}
        <div 
          className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-dashed border-muted-foreground/20 overflow-hidden"
          style={{ height: `${height}px` }}
          data-testid="heatmap-container"
        >
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Area Labels */}
          <div className="absolute top-2 left-2 text-xs text-muted-foreground font-medium">
            Chennai Metropolitan Area
          </div>
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            Live Job Distribution
          </div>

          {/* Animated Location Pins */}
          <AnimatePresence>
            {filteredLocations.map((location) => (
              <motion.div
                key={location.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ 
                  scale: 0, 
                  y: -50,
                  opacity: 0
                }}
                animate={visiblePins.has(location.id) ? { 
                  scale: 1, 
                  y: 0,
                  opacity: 1
                } : {
                  scale: 0,
                  y: -50,
                  opacity: 0
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.6
                }}
                whileHover={{ scale: 1.2 }}
                data-testid={`pin-${location.id}`}
              >
                {/* Pin Shadow */}
                <motion.div
                  className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm"
                  initial={{ scale: 0 }}
                  animate={visiblePins.has(location.id) ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: 0.2 }}
                />

                {/* Main Pin */}
                <motion.div
                  className={`${getPinSize(location.jobCount)} ${getHeatColor(location.jobCount)} rounded-full border-2 border-white shadow-lg relative`}
                  whileHover={{ 
                    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                    y: -2
                  }}
                >
                  {/* Pulse Effect */}
                  <motion.div
                    className={`absolute inset-0 ${getHeatColor(location.jobCount)} rounded-full`}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Pin Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>

                  {/* Tooltip */}
                  <motion.div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    initial={{ y: 10, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                  >
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                      <div className="font-semibold">{location.name}</div>
                      <div className="text-gray-300">
                        {location.jobCount} jobs • ₹{location.averageRate} avg
                      </div>
                      <div className="text-gray-400 capitalize">
                        {location.category.replace('_', ' ')}
                      </div>
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Heat Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg">
            <div className="text-xs font-semibold mb-2">Job Density</div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Very High</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 shadow-lg">
            <div className="text-xs font-semibold mb-1">Animation Progress</div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min(100, (visiblePins.size / filteredLocations.length) * 100)}%`
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {visiblePins.size}/{filteredLocations.length} pins
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalJobs}</div>
            <div className="text-sm text-muted-foreground">Total Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₹{averageRate}</div>
            <div className="text-sm text-muted-foreground">Average Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{filteredLocations.length}</div>
            <div className="text-sm text-muted-foreground">Active Areas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(...filteredLocations.map(l => l.jobCount))}
            </div>
            <div className="text-sm text-muted-foreground">Peak Demand</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}