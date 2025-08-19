/**
 * Mobile Address Form Component
 * Provides consistent address input fields for mobile interfaces
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, RotateCcw, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface MobileAddressFormProps {
  values: {
    houseNumber: string;
    streetName: string;
    areaName: string;
    district: string;
    state: string;
    pincode: string;
  };
  onChange: (field: string, value: string) => void;
  isDetecting?: boolean;
  onDetect?: () => void;
  onReDetect?: () => void;
  showReDetect?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MobileAddressForm({ 
  values,
  onChange,
  isDetecting = false, 
  onDetect, 
  onReDetect, 
  showReDetect = false,
  disabled = false,
  className = ""
}: MobileAddressFormProps) {
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch districts data
  const { data: districtsData } = useQuery({
    queryKey: ["/api/districts"],
    enabled: true,
  });

  // Extract states from districts data
  const availableStates = districtsData ? Object.keys(districtsData) : [];

  // Update available districts when state changes
  useEffect(() => {
    if (values.state && districtsData && districtsData[values.state]) {
      const stateData = districtsData[values.state] as any;
      setAvailableDistricts(stateData.districts || []);
      // Reset district selection when state changes if current district is not in new state
      if (values.district && !stateData.districts?.includes(values.district)) {
        onChange('district', '');
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [values.state, districtsData, values.district, onChange]);

  // Auto-detect location function
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location detection. Please enter manually.",
        variant: "destructive",
      });
      return;
    }

    // Call parent's onDetect if provided, otherwise use internal logic
    if (onDetect) {
      onDetect();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get location details
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          
          // Extract location components
          const detectedState = data.principalSubdivision || data.countryName;
          const detectedDistrict = data.city || data.locality || data.principalSubdivisionCode;
          const detectedArea = data.quarter || data.suburb || data.neighbourhood || "";
          const detectedPincode = data.postcode || "";
          
          // Find matching state in our districts data
          if (districtsData && detectedState) {
            const matchedState = Object.keys(districtsData).find(state => 
              state.toLowerCase().includes(detectedState.toLowerCase()) ||
              detectedState.toLowerCase().includes(state.toLowerCase())
            );
            
            if (matchedState) {
              onChange('state', matchedState);
              
              // Find matching district
              const stateData = districtsData[matchedState] as any;
              const stateDistricts = stateData.districts || [];
              const matchedDistrict = stateDistricts.find((district: string) =>
                district.toLowerCase().includes(detectedDistrict.toLowerCase()) ||
                detectedDistrict.toLowerCase().includes(district.toLowerCase())
              );
              
              if (matchedDistrict) {
                onChange('district', matchedDistrict);
              }
              
              // Set other detected fields
              if (detectedArea) {
                onChange('areaName', detectedArea);
              }
              if (detectedPincode) {
                onChange('pincode', detectedPincode);
              }
              
              toast({
                title: "Location detected!",
                description: `Set to ${matchedState}${matchedDistrict ? `, ${matchedDistrict}` : ''}`,
              });
            } else {
              toast({
                title: "Location detected",
                description: "Please verify and adjust the detected location manually.",
              });
            }
          }
        } catch (error) {
          toast({
            title: "Location detection failed",
            description: "Please enter your address manually.",
            variant: "destructive",
          });
        }
      },
      (error) => {
        toast({
          title: "Location access denied",
          description: "Please enter your address manually.",
          variant: "destructive",
        });
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Detection Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Your Location</span>
        </div>
        <div className="flex gap-2">
          {showReDetect && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReDetect || handleAutoDetectLocation}
              disabled={isDetecting || disabled}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Re-Detect
            </Button>
          )}
          {!showReDetect && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoDetectLocation}
              disabled={isDetecting || disabled}
              className="text-xs h-10"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <MapPin className="h-3 w-3 mr-1" />
                  Auto-Detect
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* House Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">House Number</label>
        <Input 
          placeholder="House/Flat/Building No." 
          value={values.houseNumber}
          onChange={(e) => onChange('houseNumber', e.target.value)}
          disabled={disabled}
          className="h-12"
        />
      </div>

      {/* Street Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Street Name</label>
        <Input 
          placeholder="Street/Road Name" 
          value={values.streetName}
          onChange={(e) => onChange('streetName', e.target.value)}
          disabled={disabled}
          className="h-12"
        />
      </div>

      {/* Area Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Area Name</label>
        <Input 
          placeholder="Area/Locality Name" 
          value={values.areaName}
          onChange={(e) => onChange('areaName', e.target.value)}
          disabled={disabled}
          className="h-12"
        />
      </div>

      {/* District and PIN Code Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* District */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">District</label>
          <div className="relative">
            <select 
              value={values.district}
              onChange={(e) => onChange('district', e.target.value)}
              disabled={!values.state || disabled}
              className="w-full h-12 px-3 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                {values.state ? "Select district" : "Select state first"}
              </option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* PIN Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">PIN Code</label>
          <Input 
            placeholder="PIN Code" 
            value={values.pincode}
            onChange={(e) => onChange('pincode', e.target.value)}
            disabled={disabled}
            className="h-12"
            maxLength={6}
          />
        </div>
      </div>

      {/* State */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">State</label>
        <div className="relative">
          <select 
            value={values.state}
            onChange={(e) => onChange('state', e.target.value)}
            disabled={disabled}
            className="w-full h-12 px-3 border border-gray-300 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="" disabled>Select state</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}