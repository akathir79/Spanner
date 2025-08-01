import { db } from './server/db';
import { areas } from './shared/schema';
import { eq, like } from 'drizzle-orm';

// Function to detect and clean up all problematic Tamil names
async function finalTamilCleanup() {
  try {
    console.log('Starting final Tamil cleanup...');
    
    // Find all areas with garbled Tamil text (contains repeated single characters)
    const problematicAreas = await db.select().from(areas).where(
      like(areas.tamilName, '%அஅ%')
    );
    
    console.log(`Found ${problematicAreas.length} areas with garbled Tamil text`);
    
    for (const area of problematicAreas) {
      // For garbled names, create a simple Tamil transliteration
      const simpleName = area.name
        .replace(/^\d+\s*\.?\s*/, '') // Remove numbers
        .replace(/\s*\(.*\)\s*$/, '') // Remove parentheses
        .trim();
      
      // Simple Tamil rendering based on phonetics
      let tamilName = '';
      const cleanName = simpleName.toLowerCase();
      
      // Basic phonetic mapping for common Tamil place names
      if (cleanName.includes('kudi')) {
        tamilName = simpleName.replace(/kudi/i, 'குடி');
      } else if (cleanName.includes('palayam')) {
        tamilName = simpleName.replace(/palayam/i, 'பாளையம்');
      } else if (cleanName.includes('patti')) {
        tamilName = simpleName.replace(/patti/i, 'பட்டி');
      } else if (cleanName.includes('puram')) {
        tamilName = simpleName.replace(/puram/i, 'புரம்');
      } else if (cleanName.includes('nagar')) {
        tamilName = simpleName.replace(/nagar/i, 'நகர்');
      } else if (cleanName.includes('ur') || cleanName.includes('oor')) {
        tamilName = simpleName.replace(/(ur|oor)/i, 'ூர்');
      } else if (cleanName.includes('vadi')) {
        tamilName = simpleName.replace(/vadi/i, 'வாடி');
      } else if (cleanName.includes('nallur')) {
        tamilName = simpleName.replace(/nallur/i, 'நல்லூர்');
      } else {
        // For other names, create a basic Tamil version
        tamilName = createBasicTamilName(simpleName);
      }
      
      if (tamilName && tamilName !== area.tamilName) {
        await db.update(areas)
          .set({ tamilName: tamilName })
          .where(eq(areas.id, area.id));
        
        console.log(`Fixed: ${area.name}: ${area.tamilName} → ${tamilName}`);
      }
    }
    
    console.log('Final Tamil cleanup completed!');
    
  } catch (error) {
    console.error('Error during final Tamil cleanup:', error);
  }
}

function createBasicTamilName(englishName: string): string {
  // Simple phonetic conversion for remaining names
  const phoneticMap: Record<string, string> = {
    'a': 'அ', 'b': 'ப', 'c': 'ச', 'd': 'த', 'e': 'எ', 'f': 'ஃப',
    'g': 'க', 'h': 'ஹ', 'i': 'இ', 'j': 'ஜ', 'k': 'க', 'l': 'ல',
    'm': 'ம', 'n': 'ன', 'o': 'ஒ', 'p': 'ப', 'q': 'க', 'r': 'ர',
    's': 'ச', 't': 'த', 'u': 'உ', 'v': 'வ', 'w': 'வ', 'x': 'க்ஸ',
    'y': 'ய', 'z': 'ஸ'
  };
  
  let result = '';
  const name = englishName.toLowerCase();
  
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    if (char === ' ') {
      result += ' ';
    } else if (phoneticMap[char]) {
      result += phoneticMap[char];
    }
  }
  
  return result;
}

// Run the cleanup
finalTamilCleanup();