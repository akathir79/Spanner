import { db } from './server/db';
import { districts, areas } from './shared/schema';
import { eq } from 'drizzle-orm';

// Tamil translations for common place names and suffixes
const tamilTranslations = {
  // Common suffixes and words
  'puram': 'புரம்',
  'nagar': 'நகர்',
  'pettai': 'பேட்டை',
  'palayam': 'பாளையம்',
  'kuppam': 'குப்பம்',
  'vakkam': 'வாக்கம்',
  'pattu': 'பட்டு',
  'ur': 'ஊர்',
  'oor': 'ஊர்',
  'mangalam': 'மங்கலம்',
  'kolam': 'கோளம்',
  'kulam': 'குளம்',
  'kottai': 'கோட்டை',
  'nadu': 'நாடு',
  'thangal': 'தாங்கல்',
  'durai': 'துறை',
  'kudi': 'குடி',
  'vadi': 'வாடி',
  'garam': 'கரம்',
  'ambakkam': 'அம்பாக்கம்',
  'road': 'ரோடு',
  'north': 'வடக்கு',
  'south': 'தெற்கு',
  'east': 'கிழக்கு',
  'west': 'மேற்கு',
  'new': 'புதிய',
  'old': 'பழைய',
  'five': 'ஐந்து',
  'fort': 'கோட்டை',
  'city': 'நகரம்',
  'town': 'நகரம்',
  
  // Specific area translations
  'adyar': 'அடையாறு',
  'anna nagar': 'அண்ணா நகர்',
  't. nagar': 'டி. நகர்',
  'velachery': 'வேளச்சேரி',
  'tambaram': 'தாம்பரம்',
  'mylapore': 'மயிலாப்பூர்',
  'kodambakkam': 'கோடம்பாக்கம்',
  'nungambakkam': 'நுங்கம்பாக்கம்',
  'guindy': 'கிண்டி',
  'egmore': 'எழும்பூர்',
  'chrompet': 'குரோம்பேட்',
  'pallavaram': 'பல்லாவரம்',
  'alandur': 'ஆலந்தூர்',
  'sholinganallur': 'சோளிங்கநல்லூர்',
  'thiruvanmiyur': 'திருவான்மியூர்',
  'besant nagar': 'பெசன்ட் நகர்',
  'royapettah': 'ராயப்பேட்டை',
  'teynampet': 'தெய்னாம்பேட்',
  'ambattur': 'அம்பத்தூர்',
  'madipakkam': 'மதிப்பாக்கம்',
  'perungudi': 'பெருங்குடி',
  'porur': 'போரூர்',
  
  // Salem areas
  'salem': 'சேலம்',
  'attur': 'ஆத்தூர்',
  'edappadi': 'இடப்பாடி',
  'mettur': 'மேட்டூர்',
  'yercaud': 'ஏற்காடு',
  'sankagiri': 'சங்ககிரி',
  'omalur': 'ஓமலூர்',
  'belur': 'பேலூர்',
  'vazhapadi': 'வாழப்பாடி',
  'ammapet': 'அம்மாபேட்',
  'shevapet': 'ஷேவாபேட்',
  'cherry road': 'செர்ரி ரோடு',
  'five roads': 'ஐந்து சாலைகள்',
  'new fairlands': 'நியூ ஃபேர்லாந்து',
  
  // Coimbatore areas
  'coimbatore': 'கோயம்புத்தூர்',
  'ganapathy': 'கணபதி',
  'peelamedu': 'பீளமேடு',
  'saravanampatti': 'சரவணம்பட்டி',
  'singanallur': 'சிங்காநல்லூர்',
  'r.s. puram': 'ஆர்.எஸ். புரம்',
  'pollachi': 'பொள்ளாச்சி',
  'mettupalayam': 'மேட்டுப்பாளையம்',
  'udumalaipettai': 'உடுமலைப்பேட்டை',
  'valparai': 'வால்பாறை',
  'sulur': 'சூலூர்',
  'perur': 'பேரூர்',
  'madukkarai': 'மதுக்கரை',
  'karamadai': 'காரமடை',
  
  // Madurai areas
  'madurai': 'மதுரை',
  'thiruparankundram': 'திருப்பரங்குன்றம்',
  'usilampatti': 'உசிலம்பட்டி',
  'melur': 'மேலூர்',
  'vadipatti': 'வாடிப்பட்டி',
  'tirumangalam': 'திருமங்கலம்',
  'alanganallur': 'அலங்காநல்லூர்',
  
  // Kanchipuram areas
  'kanchipuram': 'காஞ்சிபுரம்',
  'kancheepuram': 'காஞ்சீபুரம்',
  'walajabad': 'வாலாஜாபாத்',
  'uthiramerur': 'உத்திரமேரூர்'
};

// Function to generate Tamil name for a place
function generateTamilName(englishName: string): string {
  const lowerName = englishName.toLowerCase();
  
  // Direct translation if available
  if (tamilTranslations[lowerName]) {
    return tamilTranslations[lowerName];
  }
  
  // Try to find partial matches for compound words
  for (const [english, tamil] of Object.entries(tamilTranslations)) {
    if (lowerName.includes(english)) {
      // For compound words, try to construct Tamil equivalent
      let tamilVersion = lowerName.replace(english, tamil);
      
      // Clean up common patterns
      tamilVersion = tamilVersion.replace(/\s+/g, '');
      
      // If it looks reasonable, return it
      if (tamilVersion.includes(tamil)) {
        return tamilVersion;
      }
    }
  }
  
  // Fallback: transliterate common suffixes
  let tamilName = lowerName;
  
  // Replace common endings
  if (tamilName.endsWith('puram')) tamilName = tamilName.replace('puram', 'புரம்');
  else if (tamilName.endsWith('nagar')) tamilName = tamilName.replace('nagar', 'நகர்');
  else if (tamilName.endsWith('pettai')) tamilName = tamilName.replace('pettai', 'பேட்டை');
  else if (tamilName.endsWith('kuppam')) tamilName = tamilName.replace('kuppam', 'குப்பம்');
  else if (tamilName.endsWith('vakkam')) tamilName = tamilName.replace('vakkam', 'வாக்கம்');
  else if (tamilName.endsWith('palayam')) tamilName = tamilName.replace('palayam', 'பாளையம்');
  else if (tamilName.endsWith('pattu')) tamilName = tamilName.replace('pattu', 'பட்டு');
  else if (tamilName.endsWith('ur')) tamilName = tamilName.replace('ur', 'ஊர்');
  else if (tamilName.endsWith('oor')) tamilName = tamilName.replace('oor', 'ஊர்');
  
  // If we made any changes, return the result
  if (tamilName !== lowerName) {
    return tamilName;
  }
  
  // If no translation found, return original name (we'll add manually for important ones)
  return englishName;
}

async function addTamilNames() {
  try {
    console.log('Starting Tamil name addition...');
    
    // Update districts that don't have Tamil names
    const allDistricts = await db.select().from(districts);
    console.log(`Processing ${allDistricts.length} districts...`);
    
    for (const district of allDistricts) {
      if (!district.tamilName || district.tamilName.trim() === '') {
        const tamilName = generateTamilName(district.name);
        if (tamilName !== district.name) {
          await db.update(districts)
            .set({ tamilName: tamilName })
            .where(eq(districts.id, district.id));
          console.log(`Updated district: ${district.name} -> ${tamilName}`);
        }
      }
    }
    
    // Update areas that don't have Tamil names
    const allAreas = await db.select().from(areas);
    console.log(`Processing ${allAreas.length} areas...`);
    
    let updatedCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < allAreas.length; i += batchSize) {
      const batch = allAreas.slice(i, i + batchSize);
      
      for (const area of batch) {
        if (!area.tamilName || area.tamilName.trim() === '') {
          const tamilName = generateTamilName(area.name);
          if (tamilName !== area.name) {
            await db.update(areas)
              .set({ tamilName: tamilName })
              .where(eq(areas.id, area.id));
            updatedCount++;
          }
        }
      }
      
      console.log(`Processed ${Math.min((i + batchSize), allAreas.length)}/${allAreas.length} areas...`);
    }
    
    console.log(`Tamil name addition completed! Updated ${updatedCount} areas.`);
    
    // Show some examples
    const sampleAreas = await db.select().from(areas).limit(10);
    console.log('\nSample areas with Tamil names:');
    sampleAreas.forEach(area => {
      console.log(`${area.name} (${area.tamilName || 'No Tamil name'})`);
    });
    
  } catch (error) {
    console.error('Error adding Tamil names:', error);
  }
}

addTamilNames();