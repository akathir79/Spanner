import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, MapPin, IndianRupee, BarChart3 } from 'lucide-react';

interface RegionBudgetData {
  state: string;
  district: string;
  area: string;
  averageBudgetMin: number;
  averageBudgetMax: number;
  jobCount: number;
  serviceCategory: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface BudgetHeatMapProps {
  className?: string;
}

export default function BudgetHeatMap({ className = '' }: BudgetHeatMapProps) {
  const [budgetData, setBudgetData] = useState<RegionBudgetData[]>([]);
  const [filteredData, setFilteredData] = useState<RegionBudgetData[]>([]);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'state' | 'district' | 'area'>('state');
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  // Fetch budget data from backend
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/budget-analytics/heat-map');
        if (response.ok) {
          const data = await response.json();
          setBudgetData(data.budgetData || []);
          setServices(data.serviceCategories || []);
          setStates(data.states || []);
        } else {
          // Fallback to mock data for demonstration
          generateMockData();
        }
      } catch (error) {
        console.error('Error fetching budget data:', error);
        generateMockData();
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetData();
  }, []);

  // Generate mock data for demonstration
  const generateMockData = () => {
    const mockStates = ['Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Kerala', 'Maharashtra', 'Gujarat'];
    const mockServices = ['Plumbing', 'Electrical', 'Painting', 'Mechanics', 'Cleaning', 'Carpentry'];
    const mockDistricts = ['Chennai', 'Coimbatore', 'Salem', 'Anantapur', 'Bangalore', 'Mysore'];
    const mockAreas = ['Anna Nagar', 'T. Nagar', 'Velachery', 'Whitefield', 'Koramangala', 'Indiranagar'];

    const mockData: RegionBudgetData[] = [];
    
    mockStates.forEach(state => {
      mockServices.forEach(service => {
        mockDistricts.forEach(district => {
          mockAreas.forEach(area => {
            const baseMin = Math.floor(Math.random() * 1000) + 500;
            const baseMax = baseMin + Math.floor(Math.random() * 2000) + 1000;
            const trend: 'up' | 'down' | 'stable' = ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any;
            
            mockData.push({
              state,
              district,
              area,
              averageBudgetMin: baseMin,
              averageBudgetMax: baseMax,
              jobCount: Math.floor(Math.random() * 50) + 5,
              serviceCategory: service,
              trend,
              trendPercentage: Math.floor(Math.random() * 20) + 1
            });
          });
        });
      });
    });

    setBudgetData(mockData);
    setServices(mockServices);
    setStates(mockStates);
  };

  // Filter data based on selections
  useEffect(() => {
    let filtered = budgetData;

    if (selectedState !== 'all') {
      filtered = filtered.filter(item => item.state === selectedState);
    }

    if (selectedService !== 'all') {
      filtered = filtered.filter(item => item.serviceCategory === selectedService);
    }

    // Group by selected view
    const grouped = filtered.reduce((acc, item) => {
      let key = '';
      switch (selectedView) {
        case 'state':
          key = `${item.state}-${item.serviceCategory}`;
          break;
        case 'district':
          key = `${item.district}-${item.serviceCategory}`;
          break;
        case 'area':
          key = `${item.area}-${item.serviceCategory}`;
          break;
      }

      if (!acc[key]) {
        acc[key] = {
          ...item,
          averageBudgetMin: 0,
          averageBudgetMax: 0,
          jobCount: 0
        };
      }

      acc[key].averageBudgetMin += item.averageBudgetMin;
      acc[key].averageBudgetMax += item.averageBudgetMax;
      acc[key].jobCount += item.jobCount;
      
      return acc;
    }, {} as Record<string, RegionBudgetData>);

    // Calculate averages and convert back to array
    const result = Object.values(grouped).map(item => ({
      ...item,
      averageBudgetMin: Math.round(item.averageBudgetMin / Object.keys(grouped).filter(k => k.includes(item.serviceCategory)).length),
      averageBudgetMax: Math.round(item.averageBudgetMax / Object.keys(grouped).filter(k => k.includes(item.serviceCategory)).length)
    }));

    setFilteredData(result.slice(0, 20)); // Limit to top 20 for performance
  }, [budgetData, selectedState, selectedService, selectedView]);

  // Get heat map color based on budget range
  const getHeatMapColor = (budgetMin: number, budgetMax: number) => {
    const avgBudget = (budgetMin + budgetMax) / 2;
    
    if (avgBudget < 1000) return 'bg-green-100 text-green-800 border-green-200';
    if (avgBudget < 2000) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (avgBudget < 3000) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Get trend icon
  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <BarChart3 className="w-4 h-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Budget Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Interactive Budget Heat Map
        </CardTitle>
        <CardDescription>
          Average service rates by region - helping you understand pricing trends across India
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={selectedView} onValueChange={(value: 'state' | 'district' | 'area') => setSelectedView(value)}>
            <SelectTrigger data-testid="select-view">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="state">By State</SelectItem>
              <SelectItem value="district">By District</SelectItem>
              <SelectItem value="area">By Area</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger data-testid="select-state">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger data-testid="select-service">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(service => (
                <SelectItem key={service} value={service}>{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedState('all');
              setSelectedService('all');
              setSelectedView('state');
            }}
            data-testid="button-reset-filters"
          >
            Reset Filters
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Budget Ranges:</span>
          <Badge className="bg-green-100 text-green-800 border-green-200">₹500-₹999</Badge>
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">₹1000-₹1999</Badge>
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">₹2000-₹2999</Badge>
          <Badge className="bg-red-100 text-red-800 border-red-200">₹3000+</Badge>
        </div>

        {/* Heat Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
          {filteredData.map((item, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${getHeatMapColor(item.averageBudgetMin, item.averageBudgetMax)}`}
              data-testid={`heat-map-item-${index}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {selectedView === 'state' ? item.state : selectedView === 'district' ? item.district : item.area}
                  </span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.trend, item.trendPercentage)}
                    <span className="text-xs">{item.trendPercentage}%</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600">
                  {item.serviceCategory}
                </div>
                
                <div className="flex items-center gap-1 font-semibold">
                  <IndianRupee className="w-3 h-3" />
                  <span className="text-sm">
                    {item.averageBudgetMin.toLocaleString('en-IN')} - {item.averageBudgetMax.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500">
                  {item.jobCount} jobs posted
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No budget data available for the selected filters.</p>
            <p className="text-sm">Try adjusting your filter criteria.</p>
          </div>
        )}

        {/* Summary Statistics */}
        {filteredData.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Summary Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Average Range:</span>
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  {Math.round(filteredData.reduce((sum, item) => sum + item.averageBudgetMin, 0) / filteredData.length).toLocaleString('en-IN')} - 
                  {Math.round(filteredData.reduce((sum, item) => sum + item.averageBudgetMax, 0) / filteredData.length).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Total Jobs:</span>
                <div>{filteredData.reduce((sum, item) => sum + item.jobCount, 0).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Regions Analyzed:</span>
                <div>{filteredData.length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}