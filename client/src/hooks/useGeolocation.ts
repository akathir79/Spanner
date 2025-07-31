import { useState, useEffect, useRef } from 'react';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackLocation?: boolean;
  updateInterval?: number;
}

export interface GeolocationState {
  location: GeolocationData | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  isTracking: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 60000,
    trackLocation = false,
    updateInterval = 5000
  } = options;

  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: false,
    isSupported: 'geolocation' in navigator,
    isTracking: false
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge
  };

  const handleSuccess = (position: GeolocationPosition) => {
    const { coords, timestamp } = position;
    setState(prev => ({
      ...prev,
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        speed: coords.speed,
        heading: coords.heading,
        timestamp
      },
      error: null,
      isLoading: false
    }));
  };

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = 'Location access denied';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
      default:
        errorMessage = 'An unknown error occurred';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
      isTracking: false
    }));
  };

  const getCurrentLocation = () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geolocationOptions);
  };

  const startTracking = () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser'
      }));
      return;
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    if (trackLocation) {
      // Use watchPosition for continuous tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    } else {
      // Use periodic getCurrentPosition calls
      intervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geolocationOptions);
      }, updateInterval);
    }
  };

  const stopTracking = () => {
    setState(prev => ({ ...prev, isTracking: false }));

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted';
    } catch (error) {
      // Fallback: try to get location to trigger permission prompt
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { ...geolocationOptions, timeout: 5000 }
        );
      });
    }
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    ...state,
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestPermission
  };
}