'use client';

import { useState, useEffect, useCallback } from 'react';

export type GeolocationData = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
} | null;

export type UseGeolocationReturn = {
  location: GeolocationData;
  isLoading: boolean;
  error: GeolocationPositionError | null;
  requestLocation: () => void;
};

/**
 * Hook to get user's geolocation using Browser Geolocation API
 * Requests permission and gets accurate coordinates
 */
export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationData>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
        console.warn('[Geolocation] Error getting location:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  // Optionally request location on mount (can be disabled if you want manual trigger)
  // useEffect(() => {
  //   requestLocation();
  // }, [requestLocation]);

  return {
    location,
    isLoading,
    error,
    requestLocation,
  };
}

