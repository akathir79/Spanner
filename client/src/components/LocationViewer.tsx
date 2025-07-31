import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  User,
  Maximize,
  Minimize,
  RefreshCw,
  Route,
  Timer
} from 'lucide-react';

interface LocationViewerProps {
  bookingId: string;
  workerName: string;
  isActive?: boolean;
}

interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  address: string;
  timestamp: string;
  batteryLevel: number | null;
  connectionType: string;
}

export default function LocationViewer({ bookingId, workerName, isActive = false }: LocationViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get latest location data
  const { data: locationData, isLoading, refetch } = useQuery<LocationData>({
    queryKey: ['/api/location-tracking/latest', bookingId],
    enabled: !!bookingId && isActive,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get location history
  const { data: locationHistory } = useQuery<LocationData[]>({
    queryKey: ['/api/location-tracking/history', bookingId],
    enabled: !!bookingId && isActive,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get sharing session details
  const { data: sharingSession } = useQuery({
    queryKey: ['/api/location-sharing', bookingId],
    enabled: !!bookingId && isActive,
  });

  // Calculate estimated arrival time
  useEffect(() => {
    if (locationData && locationData.speed && locationData.speed > 0) {
      // This is a simplified calculation - in production you'd use proper routing APIs
      const averageSpeed = Math.max(locationData.speed * 3.6, 5); // Convert to km/h, minimum 5 km/h
      const estimatedDistanceKm = 2; // Rough estimate - in production, calculate actual route distance
      const estimatedTimeMinutes = (estimatedDistanceKm / averageSpeed) * 60;
      
      const arrivalTime = new Date(Date.now() + estimatedTimeMinutes * 60 * 1000);
      setEstimatedArrival(arrivalTime.toLocaleTimeString());
    } else {
      setEstimatedArrival(null);
    }
  }, [locationData]);

  const formatLastUpdate = (timestamp: string): string => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - updateTime.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const formatSpeed = (speed: number | null): string => {
    if (speed === null || speed === 0) return 'Stationary';
    const kmh = speed * 3.6;
    if (kmh < 5) return 'Walking';
    if (kmh < 15) return 'Cycling';
    if (kmh < 50) return 'Driving (City)';
    return 'Driving (Highway)';
  };

  const formatAccuracy = (accuracy: number): string => {
    return accuracy < 1000 ? `±${Math.round(accuracy)}m` : `±${(accuracy / 1000).toFixed(1)}km`;
  };

  const openInMaps = () => {
    if (!locationData) return;
    const { latitude, longitude } = locationData;
    
    // Try Google Maps first, fallback to Apple Maps on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`http://maps.apple.com/?q=${latitude},${longitude}`);
    } else {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`);
    }
  };

  const getConnectionStatusColor = (connectionType: string): string => {
    switch (connectionType) {
      case '4g':
      case '5g':
      case 'wifi':
        return 'text-green-500';
      case '3g':
        return 'text-yellow-500';
      case 'slow-2g':
      case '2g':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!isActive) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Location tracking will be available once the worker starts the job.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sharingSession || !('isActive' in sharingSession) || !sharingSession.isActive) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>The worker hasn't enabled location sharing yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>{workerName}'s Location</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={locationData ? "default" : "secondary"}>
              {locationData ? "Live" : "Offline"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading location data...</p>
          </div>
        ) : locationData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Current Location</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {locationData.address}
                </p>
                <p className="text-xs font-mono text-muted-foreground pl-6">
                  {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Movement</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {formatSpeed(locationData.speed)}
                </p>
                <p className="text-xs text-muted-foreground pl-6">
                  Accuracy: {formatAccuracy(locationData.accuracy)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Update</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  {formatLastUpdate(locationData.timestamp)}
                </p>
              </div>

              {estimatedArrival && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Estimated Arrival</span>
                  </div>
                  <p className="text-sm text-green-600 font-medium pl-6">
                    {estimatedArrival}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openInMaps}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Open in Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Device Status */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-xs">
              <div className="flex items-center gap-4">
                {locationData.batteryLevel && (
                  <span className="flex items-center gap-1">
                    🔋 {locationData.batteryLevel}%
                  </span>
                )}
                <span className={`flex items-center gap-1 ${getConnectionStatusColor(locationData.connectionType)}`}>
                  📶 {locationData.connectionType.toUpperCase()}
                </span>
              </div>
              <span className="text-muted-foreground">
                Updated {formatLastUpdate(locationData.timestamp)}
              </span>
            </div>

            {/* Expanded view with location history */}
            {isExpanded && locationHistory && locationHistory.length > 1 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Location History
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {locationHistory.slice(0, 5).map((location, index) => (
                    <div key={location.id} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                      <span className="truncate flex-1 mr-2">{location.address}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(location.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert>
            <AlertDescription>
              No location data available. The worker may have location sharing disabled.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}