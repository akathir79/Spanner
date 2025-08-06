import { db } from "./db";
import { userSequence } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import statesDistrictsData from "@shared/states-districts.json";

// Create state-district abbreviation mapping
const createAbbreviation = (name: string): string => {
  // Remove common words and take first 3 letters
  const cleanName = name.replace(/\b(District|Pradesh|State|and|&)\b/gi, '').trim();
  const words = cleanName.split(/\s+/);
  
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  } else if (words.length === 2) {
    return (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase();
  } else {
    return words.slice(0, 3).map(w => w.substring(0, 1)).join('').toUpperCase();
  }
};

// Create mapping of state and district names to abbreviations
const stateAbbreviations: Record<string, string> = {};
const districtAbbreviations: Record<string, string> = {};

statesDistrictsData.states.forEach(stateData => {
  const stateAbbr = createAbbreviation(stateData.state);
  stateAbbreviations[stateData.state] = stateAbbr;
  
  stateData.districts.forEach(district => {
    const districtAbbr = createAbbreviation(district);
    districtAbbreviations[district] = districtAbbr;
  });
});

interface UserData {
  state: string;
  district: string;
  role: 'client' | 'worker' | 'admin' | 'super_admin';
}

export async function generateCustomUserId(userData: UserData): Promise<string> {
  const { state, district, role } = userData;
  
  // Get abbreviations
  const stateAbbr = stateAbbreviations[state] || state.substring(0, 3).toUpperCase();
  const districtAbbr = districtAbbreviations[district] || district.substring(0, 3).toUpperCase();
  
  // Role prefix
  const rolePrefix = role === 'client' ? 'C' : role === 'worker' ? 'W' : role === 'admin' ? 'A' : 'S';
  
  // Create sequence key
  const sequenceKey = `${stateAbbr}-${districtAbbr}`;
  
  try {
    // Check if sequence exists for this state-district combination
    let sequence = await db
      .select()
      .from(userSequence)
      .where(and(
        eq(userSequence.state, state),
        eq(userSequence.district, district)
      ))
      .limit(1);
    
    let nextNumber: number;
    
    if (sequence.length === 0) {
      // Create new sequence
      nextNumber = 1;
      await db.insert(userSequence).values({
        id: sequenceKey,
        state: state,
        district: district,
        lastNumber: nextNumber,
      });
    } else {
      // Update existing sequence
      nextNumber = sequence[0].lastNumber + 1;
      await db
        .update(userSequence)
        .set({ 
          lastNumber: nextNumber,
          updatedAt: new Date()
        })
        .where(eq(userSequence.id, sequenceKey));
    }
    
    // Format number with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    
    // Create final user ID: STATE-DISTRICT-ROLEXXXX
    const customUserId = `${stateAbbr}-${districtAbbr}-${rolePrefix}${formattedNumber}`;
    
    return customUserId;
    
  } catch (error) {
    console.error('Error generating custom user ID:', error);
    // Fallback to timestamp-based ID if there's an error
    const timestamp = Date.now().toString().slice(-6);
    return `${stateAbbr}-${districtAbbr}-${rolePrefix}${timestamp}`;
  }
}

// Helper function to validate custom user ID format
export function validateCustomUserId(userId: string): boolean {
  const pattern = /^[A-Z]{3}-[A-Z]{3}-[CWAS]\d{4}$/;
  return pattern.test(userId);
}

// Helper function to extract information from custom user ID
export function parseCustomUserId(userId: string): {
  stateAbbr: string;
  districtAbbr: string;
  role: string;
  number: string;
} | null {
  if (!validateCustomUserId(userId)) return null;
  
  const parts = userId.split('-');
  const roleAndNumber = parts[2];
  const role = roleAndNumber.substring(0, 1);
  const number = roleAndNumber.substring(1);
  
  const roleMap: Record<string, string> = {
    'C': 'client',
    'W': 'worker', 
    'A': 'admin',
    'S': 'super_admin'
  };
  
  return {
    stateAbbr: parts[0],
    districtAbbr: parts[1],
    role: roleMap[role] || 'unknown',
    number: number
  };
}