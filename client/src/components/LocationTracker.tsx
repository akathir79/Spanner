import React, { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Navigation, 
  Wifi, 
  WifiOff, 
  Battery, 
  Clock,
  Share,
  Eye,
  EyeOff
} from 'lucide-react';

interface LocationTrackerProps {
  bookingId: string;
  workerId: string;
  clientId: string;
  isActive?: boolean;
  onLocationUpdate?: (location: any) => void;
}

export default function LocationTracker({ 
  bookingId, 
  workerId, 
  clientId, 
  isActive = false,
  onLocationUpdate 
}: LocationTrackerProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [sharePreferences, setSharePreferences] = useState({
    realTime: true,
    locationHistory: true,
    estimatedArrival: true
  });

  const {
    location,
    error: gpsError,
    isLoading,
    isSupported,
    isTracking,
    startTracking,
    stopTracking,
    requestPermission
  } = useGeolocation({
    enableHighAccuracy: true,
    trackLocation: true,
    updateInterval: 10000, // Update every 10 seconds
    timeout: 30000,
    maximumAge: 5000
  });

  // Get sharing session status
  const { data: sharingSession } = useQuery({
    queryKey: ['/api/location-sharing', bookingId],
    enabled: !!bookingId
  });

  // Send location update
  const locationUpdateMutation = useMutation({
    mutationFn: async (locationData: any) => {
      const batteryLevel = await getBatteryLevel();
      const connectionType = getConnectionType();
      
      return apiRequest('/api/location-tracking', {
        method: 'POST',
        body: JSON.stringify({
          bookingId,
          workerId,
          ...locationData,
          isSharedWithClient: isSharing,
          batteryLevel,
          connectionType
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/location-tracking', bookingId] });
    }
  });

  // Start/stop location sharing session
  const sharingSessionMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      if (action === 'start') {
        return apiRequest('/api/location-sharing', {
          method: 'POST',
          body: JSON.stringify({
            bookingId,
            workerId,
            clientId,
            sharePreferences
          })
        });
      } else if (sharingSession?.id) {
        return apiRequest(`/api/location-sharing/${sharingSession.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: false })
        });
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/location-sharing', bookingId] });
    }
  });

  const getBatteryLevel = async (): Promise<number | null> => {
    try {
      // @ts-ignore - Battery API is not in TypeScript types yet
      const battery = await navigator.getBattery?.();
      return battery ? Math.round(battery.level * 100) : null;
    } catch {
      return null;
    }
  };

  const getConnectionType = (): string => {
    // @ts-ignore - Connection API is not fully standardized
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using a free geocoding service - in production, you'd use Google Maps or similar
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Send location updates when location changes
  useEffect(() => {
    if (location && isSharing && isActive) {
      const sendLocationUpdate = async () => {
        const address = await reverseGeocode(location.latitude, location.longitude);
        
        const locationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          address,
          timestamp: new Date(location.timestamp).toISOString()
        };

        locationUpdateMutation.mutate(locationData);
        onLocationUpdate?.(locationData);
      };

      sendLocationUpdate();
    }
  }, [location, isSharing, isActive]);

  // Auto-start tracking when active
  useEffect(() => {
    if (isActive && isSupported) {
      handleStartSharing();
    } else {
      handleStopSharing();
    }
  }, [isActive]);

  const handleStartSharing = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      return;
    }

    setIsSharing(true);
    startTracking();
    sharingSessionMutation.mutate('start');
  };

  const handleStopSharing = () => {
    setIsSharing(false);
    stopTracking();
    if (sharingSession && 'id' in sharingSession) {
      sharingSessionMutation.mutate('stop');
    }
  };

  const formatSpeed = (speed: number | null): string => {
    if (speed === null) return 'Unknown';
    return `${(speed * 3.6).toFixed(1)} km/h`; // Convert m/s to km/h
  };

  const formatAccuracy = (accuracy: number): string => {
    return accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy / 1000).toFixed(1)}km`;
  };

  if (!isSupported) {
    return (
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          GPS location tracking is not supported in this browser.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            <span>Location Tracking</span>
          </div>
          <Badge variant={isSharing ? "default" : "secondary"}>
            {isSharing ? "Sharing" : "Not Sharing"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gpsError && (
          <Alert variant="destructive">
            <AlertDescription>{gpsError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Share Location with Client</label>
          <Switch
            checked={isSharing}
            onCheckedChange={(checked) => {
              if (checked) {
                handleStartSharing();
              } else {
                handleStopSharing();
              }
            }}
            disabled={!isActive}
          />
        </div>

        {location && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span>Accuracy: {formatAccuracy(location.accuracy)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Speed: {formatSpeed(location.speed)}</span>
              </div>
              <div className="flex items-center gap-2">
                {navigator.onLine ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(location.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-sm text-muted-foreground">
            Getting your location...
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Sharing Preferences</label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time location</span>
              <Switch
                checked={sharePreferences.realTime}
                onCheckedChange={(checked) =>
                  setSharePreferences(prev => ({ ...prev, realTime: checked }))
                }
                disabled={!isSharing}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Location history</span>
              <Switch
                checked={sharePreferences.locationHistory}
                onCheckedChange={(checked) =>
                  setSharePreferences(prev => ({ ...prev, locationHistory: checked }))
                }
                disabled={!isSharing}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Estimated arrival</span>
              <Switch
                checked={sharePreferences.estimatedArrival}
                onCheckedChange={(checked) =>
                  setSharePreferences(prev => ({ ...prev, estimatedArrival: checked }))
                }
                disabled={!isSharing}
              />
            </div>
          </div>
        </div>

        {!isActive && (
          <Alert>
            <AlertDescription>
              Location tracking will automatically start when you begin work on this booking.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}