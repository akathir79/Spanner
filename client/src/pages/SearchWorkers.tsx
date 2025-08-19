import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Filter, 
  ArrowLeft,
  Briefcase,
  IndianRupee,
  Clock,
  Shield,
  MessageCircle
} from "lucide-react";

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  primaryService: string;
  hourlyRate: number;
  experienceYears: number;
  district: string;
  state: string;
  mobile: string;
  averageRating?: number;
  completedJobs?: number;
  profilePhoto?: string;
  skills?: string[];
  verified?: boolean;
}

export default function SearchWorkers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "rate" | "experience">("rating");

  // Get search parameters from URL
  const serviceParam = searchParams.get('service') || '';
  const stateParam = searchParams.get('state') || '';
  const districtParam = searchParams.get('district') || '';
  const descriptionParam = searchParams.get('description') || '';

  // Redirect non-clients
  useEffect(() => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to search for workers.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }
    
    if (user.role !== 'client') {
      toast({
        title: "Access Denied",
        description: "Only clients can search for workers.",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }
  }, [user, toast, setLocation]);

  // Fetch all workers
  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
    enabled: !!user && user.role === 'client',
  });

  // Get services for filtering
  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  // Filter and sort workers based on search criteria
  useEffect(() => {
    if (!workers) return;

    let filtered = workers.filter((worker) => {
      // Service filter
      if (serviceParam && services) {
        const selectedService = (services as any[]).find((s: any) => s.id === serviceParam);
        if (selectedService && !worker.primaryService.toLowerCase().includes(selectedService.name.toLowerCase())) {
          return false;
        }
      }

      // State filter
      if (stateParam && !worker.state.toLowerCase().includes(stateParam.toLowerCase())) {
        return false;
      }

      // District filter
      if (districtParam && !worker.district.toLowerCase().includes(districtParam.toLowerCase())) {
        return false;
      }

      // Description/skills filter
      if (descriptionParam) {
        const searchTerm = descriptionParam.toLowerCase();
        const matchesService = worker.primaryService.toLowerCase().includes(searchTerm);
        const matchesSkills = worker.skills?.some(skill => 
          skill.toLowerCase().includes(searchTerm)
        );
        if (!matchesService && !matchesSkills) {
          return false;
        }
      }

      return true;
    });

    // Sort workers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "rate":
          return a.hourlyRate - b.hourlyRate;
        case "experience":
          return b.experienceYears - a.experienceYears;
        default:
          return 0;
      }
    });

    setFilteredWorkers(filtered);
  }, [workers, serviceParam, stateParam, districtParam, descriptionParam, sortBy, services]);

  const handleContactWorker = (workerId: string) => {
    // Navigate to worker contact/booking page
    setLocation(`/book-worker/${workerId}`);
  };

  const getSelectedServiceName = () => {
    if (!serviceParam || !services) return '';
    const service = (services as any[]).find((s: any) => s.id === serviceParam);
    return service?.name || '';
  };

  if (!user || user.role !== 'client') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Search Results
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Found {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''} matching your criteria
            </p>
          </div>
        </div>

        {/* Search Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-300">Searching for:</span>
              {getSelectedServiceName() && (
                <Badge variant="secondary">{getSelectedServiceName()}</Badge>
              )}
              {stateParam && (
                <Badge variant="secondary">📍 {stateParam}</Badge>
              )}
              {districtParam && (
                <Badge variant="secondary">🏙️ {districtParam}</Badge>
              )}
              {descriptionParam && (
                <Badge variant="secondary">🔍 "{descriptionParam}"</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rating</SelectItem>
                <SelectItem value="rate">Lowest Rate</SelectItem>
                <SelectItem value="experience">Most Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading workers...</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredWorkers.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                No workers found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Try adjusting your search criteria or browse all available workers.
              </p>
              <Button onClick={() => setLocation('/')}>
                Modify Search
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Workers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((worker) => (
            <Card key={worker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {worker.firstName} {worker.lastName}
                      {worker.verified && (
                        <Shield className="h-4 w-4 text-green-600 inline ml-2" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {worker.primaryService}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">
                        {worker.averageRating?.toFixed(1) || 'New'}
                      </span>
                    </div>
                    {worker.completedJobs && (
                      <p className="text-xs text-gray-500">
                        {worker.completedJobs} jobs
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <MapPin className="h-3 w-3" />
                    {worker.district}, {worker.state}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <Clock className="h-3 w-3" />
                    {worker.experienceYears}y exp
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {worker.hourlyRate}/hr
                  </span>
                </div>

                {worker.skills && worker.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {worker.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {worker.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{worker.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => handleContactWorker(worker.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}