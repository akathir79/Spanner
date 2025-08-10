// Service normalization utilities for consistent naming throughout the app

// Standard service mappings for consistent naming
export const SERVICE_MAPPINGS = {
  // Painting services
  'painter': 'Painting',
  'painting': 'Painting',
  'paint': 'Painting',
  
  // Plumbing services
  'plumber': 'Plumbing',
  'plumbing': 'Plumbing',
  
  // Electrical services
  'electrician': 'Electrical',
  'electrical': 'Electrical',
  'electric': 'Electrical',
  
  // Carpentry services
  'carpenter': 'Carpentry',
  'carpentry': 'Carpentry',
  'wood work': 'Carpentry',
  'woodwork': 'Carpentry',
  
  // Masonry services
  'mason': 'Masonry',
  'masonry': 'Masonry',
  'brick work': 'Masonry',
  'brickwork': 'Masonry',
  
  // Cleaning services
  'cleaner': 'Cleaning',
  'cleaning': 'Cleaning',
  'housekeeping': 'Cleaning',
  
  // Gardening services
  'gardener': 'Gardening',
  'gardening': 'Gardening',
  'landscaping': 'Gardening',
  
  // Appliance repair
  'appliance repair': 'Appliance Repair',
  'appliance technician': 'Appliance Repair',
  'ac repair': 'AC Repair',
  'ac technician': 'AC Repair',
  
  // Security services
  'security guard': 'Security',
  'security': 'Security',
  'watchman': 'Security',
  
  // Driver services
  'driver': 'Driver',
  'chauffeur': 'Driver',
  
  // Delivery services
  'delivery': 'Delivery',
  'courier': 'Delivery',
  
  // Mechanic services
  'mechanic': 'Mechanic',
  'auto repair': 'Mechanic',
  'automobile repair': 'Mechanic'
} as const;

/**
 * Normalizes a service name to its standard form
 * @param serviceName - The input service name (can be lowercase, mixed case, etc.)
 * @returns The standardized service name with proper capitalization
 */
export function normalizeServiceName(serviceName: string): string {
  if (!serviceName) return '';
  
  const lowercaseInput = serviceName.toLowerCase().trim();
  
  // Check direct mapping first
  if (SERVICE_MAPPINGS[lowercaseInput as keyof typeof SERVICE_MAPPINGS]) {
    return SERVICE_MAPPINGS[lowercaseInput as keyof typeof SERVICE_MAPPINGS];
  }
  
  // Check if any mapping key contains the input or vice versa
  for (const [key, value] of Object.entries(SERVICE_MAPPINGS)) {
    if (key.includes(lowercaseInput) || lowercaseInput.includes(key)) {
      return value;
    }
  }
  
  // If no mapping found, return with proper title case
  return serviceName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Checks if two service names are equivalent (case-insensitive matching)
 * @param service1 - First service name
 * @param service2 - Second service name
 * @returns True if the services are equivalent
 */
export function areServicesEquivalent(service1: string, service2: string): boolean {
  const normalized1 = normalizeServiceName(service1);
  const normalized2 = normalizeServiceName(service2);
  return normalized1 === normalized2;
}

/**
 * Gets all possible variants of a service name for flexible matching
 * @param serviceName - The standard service name
 * @returns Array of possible service name variants
 */
export function getServiceVariants(serviceName: string): string[] {
  const variants: string[] = [];
  const normalized = normalizeServiceName(serviceName);
  
  // Add the normalized version
  variants.push(normalized);
  
  // Find all mapping keys that map to this normalized service
  for (const [key, value] of Object.entries(SERVICE_MAPPINGS)) {
    if (value === normalized) {
      variants.push(key);
    }
  }
  
  // Add common variants
  variants.push(serviceName.toLowerCase());
  variants.push(serviceName.toUpperCase());
  
  // Remove duplicates
  return [...new Set(variants)];
}

/**
 * Validates if a service name is supported
 * @param serviceName - The service name to validate
 * @returns True if the service is supported
 */
export function isValidService(serviceName: string): boolean {
  if (!serviceName) return false;
  
  const lowercaseInput = serviceName.toLowerCase().trim();
  return Object.keys(SERVICE_MAPPINGS).includes(lowercaseInput) || 
         Object.values(SERVICE_MAPPINGS).includes(normalizeServiceName(serviceName));
}

/**
 * Gets a list of all standard service names
 * @returns Array of standard service names
 */
export function getStandardServiceNames(): string[] {
  return [...new Set(Object.values(SERVICE_MAPPINGS))].sort();
}