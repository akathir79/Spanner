/**
 * Reusable Address Form Component
 * Provides consistent address input fields with auto-detection across the application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';

interface AddressFormProps {
  form: UseFormReturn<any>;
  isDetecting?: boolean;
  onDetect?: () => void;
  onReDetect?: () => void;
  showReDetect?: boolean;
  disabled?: boolean;
  className?: string;
  autoDetectOnMount?: boolean; // New prop to enable automatic detection when component mounts
}

export function AddressForm({ 
  form, 
  isDetecting = false, 
  onDetect, 
  onReDetect, 
  showReDetect = false,
  disabled = false,
  className = "",
  autoDetectOnMount = false
}: AddressFormProps) {
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const { toast } = useToast();

  // Fetch districts data
  const { data: districtsData } = useQuery({
    queryKey: ["/api/districts"],
    enabled: true,
  });

  // Extract states from districts data
  const availableStates = districtsData ? Object.keys(districtsData) : [];

  // Update available districts when state changes
  const selectedState = form.watch("state");
  useEffect(() => {
    if (selectedState && districtsData && districtsData[selectedState]) {
      const stateData = districtsData[selectedState] as any;
      setAvailableDistricts(stateData.districts || []);
      // Reset district selection when state changes
      if (form.getValues("district") && !stateData.districts?.includes(form.getValues("district"))) {
        form.setValue("district", "");
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedState, districtsData, form]);

  // Auto-detect location when component mounts (like AuthModal)
  useEffect(() => {
    if (autoDetectOnMount && !hasAutoDetected && !disabled) {
      // Start auto-detection after a short delay to allow component to render
      const timer = setTimeout(() => {
        console.log("Auto-detecting location for address form...");
        handleAutoDetectLocation();
        setHasAutoDetected(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoDetectOnMount, hasAutoDetected, disabled, handleAutoDetectLocation]);

  // Auto-detect location function
  const handleAutoDetectLocation = useCallback(() => {
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
              form.setValue("state", matchedState);
              
              // Find matching district
              const stateData = districtsData[matchedState] as any;
              const stateDistricts = stateData.districts || [];
              const matchedDistrict = stateDistricts.find((district: string) =>
                district.toLowerCase().includes(detectedDistrict.toLowerCase()) ||
                detectedDistrict.toLowerCase().includes(district.toLowerCase())
              );
              
              if (matchedDistrict) {
                form.setValue("district", matchedDistrict);
              }
              
              // Set other detected fields
              if (detectedArea) {
                form.setValue("areaName", detectedArea);
              }
              if (detectedPincode) {
                form.setValue("pincode", detectedPincode);
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
  }, [onDetect, districtsData, form, toast]);

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
              className="text-xs"
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
      <FormField
        control={form.control}
        name="houseNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>House Number</FormLabel>
            <FormControl>
              <Input 
                placeholder="House/Flat/Building No." 
                {...field} 
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Street Name */}
      <FormField
        control={form.control}
        name="streetName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Street/Road Name" 
                {...field} 
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Area Name */}
      <FormField
        control={form.control}
        name="areaName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Area Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Area/Locality Name" 
                {...field} 
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* District and PIN Code Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* District */}
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange} 
                disabled={!selectedState || disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedState ? "Select district" : "Select state first"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableDistricts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* PIN Code */}
        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PIN Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="PIN Code" 
                  {...field} 
                  disabled={disabled}
                  maxLength={6}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* State */}
      <FormField
        control={form.control}
        name="state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State</FormLabel>
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}