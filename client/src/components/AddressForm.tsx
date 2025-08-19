/**
 * Reusable Address Form Component
 * Provides consistent address input fields with auto-detection across the application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin, Loader2, RotateCcw, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

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
  const [availableDistricts, setAvailableDistricts] = useState<Array<{id: string, name: string}>>([]);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const [districtSearchInput, setDistrictSearchInput] = useState("");
  const [districtPopoverOpen, setDistrictPopoverOpen] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const { toast } = useToast();

  // Fetch districts data
  const { data: districtsData } = useQuery({
    queryKey: ["/api/districts"],
    enabled: true,
  });

  // Extract states from districts data
  const availableStates = districtsData ? Object.keys(districtsData) : [];

  // API fetch function for districts (like AuthModal)
  const fetchDistrictsFromAPI = async (stateName: string) => {
    setIsLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts/${encodeURIComponent(stateName)}`);
      if (response.ok) {
        const districtsData = await response.json();
        if (Array.isArray(districtsData) && districtsData.length > 0) {
          setAvailableDistricts(districtsData);
          console.log(`AddressForm: Loaded ${districtsData.length} districts from API for ${stateName}`);
          return;
        }
      }
      // Fallback to local data if API fails
      const fallbackDistricts = getFallbackDistricts(stateName);
      setAvailableDistricts(fallbackDistricts);
    } catch (error) {
      console.error("Error loading districts from API, using fallback:", error);
      const fallbackDistricts = getFallbackDistricts(stateName);
      setAvailableDistricts(fallbackDistricts);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  // Get fallback districts function (like AuthModal)
  const getFallbackDistricts = (stateName: string) => {
    const majorDistricts: { [key: string]: string[] } = {
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore", "Dindigul", "Thanjavur", "Tiruppur", "Kanchipuram", "Krishnagiri", "Cuddalore", "Dharmapuri", "Sivaganga", "Namakkal", "Virudhunagar", "Karur", "Thoothukudi", "Pudukkottai", "Ariyalur", "Perambalur", "Nilgiris", "Theni", "Ramanathapuram", "Tiruvarur", "Nagapattinam", "Kanyakumari", "Viluppuram", "Tiruvannamalai", "Kallakurichi", "Chengalpattu", "Tenkasi", "Tirupathur", "Ranipet", "Mayiladuthurai"],
      "Karnataka": ["Bangalore Urban", "Bangalore Rural", "Mysore", "Tumkur", "Mandya", "Hassan", "Shimoga", "Chitradurga", "Davangere", "Bellary", "Bagalkot", "Vijayapura", "Bidar", "Kalaburagi", "Raichur", "Koppal", "Gadag", "Dharwad", "Haveri", "Uttara Kannada", "Belagavi", "Udupi", "Dakshina Kannada", "Kodagu", "Chikkaballapur", "Kolar", "Chikkamagaluru", "Chamarajanagar", "Yadgir"],
      "Telangana": ["Hyderabad", "Secunderabad", "Warangal Urban", "Warangal Rural", "Khammam", "Nalgonda", "Mahbubnagar", "Rangareddy", "Medchal", "Sangareddy", "Vikarabad"]
    };
    
    const districtNames = majorDistricts[stateName] || [];
    return districtNames.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, ''),
      name: name
    }));
  };

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
          console.log("GPS coordinates:", { latitude, longitude });
          
          // Use Nominatim API like AuthModal for better Indian address detection
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
          );
          
          if (!response.ok) throw new Error('Failed to get location data');
          
          const data = await response.json();
          console.log("Nominatim data:", data);
          
          if (data && data.address) {
            const locationData = data.address;
            
            // Extract address components like AuthModal
            const houseNumber = locationData.house_number || '';
            const streetName = locationData.road || '';
            const areaName = locationData.village || locationData.suburb || locationData.neighbourhood || '';
            const detectedPincode = locationData.postcode || '';
            
            // Set individual address fields immediately 
            if (houseNumber) {
              form.setValue("houseNumber", houseNumber);
            }
            if (streetName) {
              form.setValue("streetName", streetName);
            }
            if (areaName) {
              form.setValue("areaName", areaName);
            }
            if (detectedPincode) {
              form.setValue("pincode", detectedPincode);
            }
            
            // Find matching state and district
            const detectedLocation = locationData.state_district || 
                                   locationData.county || 
                                   locationData.city || 
                                   locationData.town ||
                                   locationData.village;
            
            // Use AuthModal's matching logic for state and district
            if (locationData.state) {
              const findState = (stateName: string) => {
                const states = ["Tamil Nadu", "Karnataka", "Telangana", "Maharashtra", "Delhi", "West Bengal", "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Odisha", "Kerala", "Assam", "Bihar", "Haryana", "Punjab", "Jharkhand", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh", "Goa", "Manipur", "Tripura", "Meghalaya", "Nagaland", "Mizoram", "Sikkim", "Arunachal Pradesh", "Andhra Pradesh"];
                return states.find(state => 
                  state.toLowerCase().includes(stateName.toLowerCase()) ||
                  stateName.toLowerCase().includes(state.toLowerCase())
                );
              };

              const findDistrict = (districtName: string, stateName: string) => {
                const majorDistricts: { [key: string]: string[] } = {
                  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Tirunelveli", "Erode", "Vellore", "Dindigul", "Thanjavur", "Tiruppur", "Kanchipuram", "Krishnagiri", "Cuddalore", "Dharmapuri", "Sivaganga", "Namakkal", "Virudhunagar", "Karur", "Thoothukudi", "Pudukkottai", "Ariyalur", "Perambalur", "Nilgiris", "Theni", "Ramanathapuram", "Tiruvarur", "Nagapattinam", "Kanyakumari", "Viluppuram", "Tiruvannamalai", "Kallakurichi", "Chengalpattu", "Tenkasi", "Tirupathur", "Ranipet", "Mayiladuthurai"],
                  "Karnataka": ["Bangalore Urban", "Bangalore Rural", "Mysore", "Tumkur", "Mandya", "Hassan", "Shimoga", "Chitradurga", "Davangere", "Bellary", "Bagalkot", "Vijayapura", "Bidar", "Kalaburagi", "Raichur", "Koppal", "Gadag", "Dharwad", "Haveri", "Uttara Kannada", "Belagavi", "Udupi", "Dakshina Kannada", "Kodagu", "Chikkaballapur", "Kolar", "Chikkamagaluru", "Chamarajanagar", "Yadgir"],
                  "Telangana": ["Hyderabad", "Secunderabad", "Warangal Urban", "Warangal Rural", "Khammam", "Nalgonda", "Mahbubnagar", "Rangareddy", "Medchal", "Sangareddy", "Vikarabad"]
                };
                
                const districtNames = majorDistricts[stateName] || [];
                return districtNames.find(district =>
                  district.toLowerCase().includes(districtName.toLowerCase()) ||
                  districtName.toLowerCase().includes(district.toLowerCase())
                );
              };

              const matchedState = findState(locationData.state);
              if (matchedState) {
                form.setValue("state", matchedState);
                console.log("AddressForm: State set to:", matchedState);
                
                // Fetch districts for the matched state
                await fetchDistrictsFromAPI(matchedState);
                
                // Find district within the matched state
                if (detectedLocation) {
                  const matchedDistrict = findDistrict(detectedLocation, matchedState);
                  if (matchedDistrict) {
                    form.setValue("district", matchedDistrict);
                    console.log("AddressForm: District set to:", matchedDistrict);
                  }
                }
                
                toast({
                  title: "Location detected!",
                  description: `Set to ${matchedState}${form.getValues("district") ? `, ${form.getValues("district")}` : ''}`,
                });
              } else {
                toast({
                  title: "Location detected",
                  description: "Please verify and adjust the detected location manually.",
                });
              }
            }
          }
        } catch (error) {
          console.error("Location detection error:", error);
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
  }, [onDetect, form, toast, fetchDistrictsFromAPI]);

  // Update available districts when state changes (like AuthModal)
  const selectedState = form.watch("state");
  useEffect(() => {
    if (selectedState) {
      fetchDistrictsFromAPI(selectedState);
      // Reset district selection when state changes
      form.setValue("district", "");
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedState, fetchDistrictsFromAPI, form]);

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
        {/* District - Searchable dropdown like AuthModal */}
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <FormControl>
                <Popover open={districtPopoverOpen} onOpenChange={setDistrictPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={districtPopoverOpen}
                      className="w-full justify-between"
                      disabled={!selectedState || isLoadingDistricts}
                    >
                      {field.value
                        ? availableDistricts.find(district => district.name === field.value)?.name || field.value
                        : "Select district"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search districts..." 
                        value={districtSearchInput}
                        onValueChange={setDistrictSearchInput}
                      />
                      <CommandEmpty>
                        {isLoadingDistricts ? "Loading districts..." : "No district found."}
                      </CommandEmpty>
                      <CommandList className="max-h-40 overflow-y-auto">
                        <CommandGroup>
                          {availableDistricts
                            .filter(district => 
                              district.name.toLowerCase().includes(districtSearchInput.toLowerCase())
                            )
                            .map((district, index) => (
                              <CommandItem
                                key={district.id}
                                className="transition-all duration-150 hover:bg-accent/80"
                                onSelect={() => {
                                  field.onChange(district.name);
                                  setDistrictPopoverOpen(false);
                                  setDistrictSearchInput("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === district.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {district.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormControl>
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