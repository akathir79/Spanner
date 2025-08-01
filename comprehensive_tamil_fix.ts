import { db } from './server/db';
import { areas } from './shared/schema';
import { eq, or, like } from 'drizzle-orm';

// Comprehensive authentic Tamil names for all Tamil Nadu locations
const comprehensiveTamilNames: Record<string, string> = {
  // From the image - fixing these specific ones
  'ODAYAGUNDENPALAYAM': 'ஒடையகுண்டன்பாளையம்',
  'Vengaimandalam': 'வெங்கைமண்டலம்',
  'THALAINAYAR': 'தலைநாயர்',
  'Pulavanur': 'புலவனூர்',
  'Solaikadu': 'சோலைக்காடு',
  'Sarkar Uduppam': 'சர்க்கார் உடுப்பம்',
  'Uveri': 'உவரி',
  'Kathivakkam': 'காதிவாக்கம்',
  'ILUPPAIYOORANI': 'இலுப்பையூரணி',
  'Narayanathevanpatti': 'நாராயணதேவன்பட்டி',
  'Raramuthirakkottai': 'ராராமுத்திரக்கோட்டை',
  'KATTUNAICKENPATTI': 'கட்டுநாயக்கன்பட்டி',
  'Maniyeripatti': 'மணியேரிபட்டி',
  'T pudupalayam': 'தி புதுபாளையம்',
  'Thenmilai': 'தென்மிளை',
  'Satthanur': 'சத்தனூர்',
  'Sangeethapatti': 'சங்கீதாபட்டி',
  'Thiruppukuzhi': 'திருப்புகுழி',
  'NARASIPURAM': 'நரசிபுரம்',
  'New Fairlands': 'நியூ பேர்லாண்ட்ஸ்',

  // Major cities and towns
  'Chennai': 'சென்னை',
  'Coimbatore': 'கோயம்புத்தூர்',
  'Salem': 'சேலம்',
  'Madurai': 'மதுரை',
  'Tiruchirappalli': 'திருச்சிராப்பள்ளி',
  'Tiruppur': 'திருப்பூர்',
  'Erode': 'ஈரோடு',
  'Vellore': 'வேலூர்',
  'Thanjavur': 'தஞ்சாவூர்',
  'Dindigul': 'திண்டுக்கல்',
  'Cuddalore': 'கடலூர்',
  'Kanchipuram': 'காஞ்சிபுரம்',
  'Tirunelveli': 'திருநெல்வேலி',
  'Sivakasi': 'சிவகாசி',
  'Karur': 'கரூர்',
  'Namakkal': 'நாமக்கல்',
  'Hosur': 'ஓசூர்',
  'Krishnagiri': 'கிருஷ்ணகிரி',
  'Dharmapuri': 'தர்மபுரி',
  'Villupuram': 'விழுப்புரம்',
  'Chengalpattu': 'செங்கல்பட்டு',
  'Thiruvallur': 'திருவள்ளூர்',
  'Kanyakumari': 'கன்னியாகுமரி',
  'Thoothukudi': 'தூத்துக்குடி',
  'Virudhunagar': 'விருதுநகர்',
  'Sivaganga': 'சிவகங்கை',
  'Ramanathapuram': 'ராமநாதபுரம்',
  'Theni': 'தேனி',
  'Pudukkottai': 'புதுக்கோட்டை',
  'Nagapattinam': 'நாகப்பட்டினம்',
  'Thiruvarur': 'திருவாரூர்',
  'Mayiladuthurai': 'மயிலாடுதுறை',
  'Ariyalur': 'அரியலூர்',
  'Perambalur': 'பெரம்பலூர்',
  'Kallakurichi': 'கள்ளக்குறிச்சி',
  'Tirupattur': 'திருபத்தூர்',
  'Ranipet': 'ராணிப்பேட்',
  'Tenkasi': 'தென்காசி',
  'Chidambaram': 'சிதம்பரம்',

  // Common village/town patterns and authentic names
  'Aalampalayam': 'ஆலம்பாளையம்',
  'Aanaikatti': 'ஆனைக்கட்டி',
  'Aanaipalayam': 'ஆனைபாளையம்',
  'Aarani': 'ஆரணி',
  'Aathur': 'ஆத்தூர்',
  'Aayakudi': 'ஆயக்குடி',
  'Abbirampuram': 'அபிராம்பூரம்',
  'Achampet': 'ஆச்சம்பேட்',
  'Adambakkam': 'ஆதம்பாக்கம்',
  'Adayar': 'அடையாறு',
  'Adhanur': 'ஆதனூர்',
  'Adhirampattinam': 'அதிராம்பட்டினம்',
  'Agaram': 'அகரம்',
  'Agarapettai': 'அகரபேட்டை',
  'Agasthiyapuram': 'அகஸ்தியபுரம்',
  'Aiyampettai': 'ஐயம்பேட்டை',
  'Alagapuram': 'அலகாபுரம்',
  'Alambadi': 'ஆலம்பாடி',
  'Alampalayam': 'ஆலம்பாளையம்',
  'Alangudi': 'அலங்குடி',
  'Alavadi': 'ஆலவாடி',
  'Allinagaram': 'அல்லிநகரம்',
  'Alundur': 'ஆலுந்தூர்',
  'Ambalappadi': 'அம்பலப்பாடி',
  'Ambasamudram': 'அம்பாசமுத்திரம்',
  'Ambattur': 'அம்பத்தூர்',
  'Ammapettai': 'அம்மாபேட்டை',
  'Anaikatti': 'ஆனைக்கட்டி',
  'Anaipalayam': 'ஆனைபாளையம்',
  'Andanallur': 'அண்டநல்லூர்',
  'Andipalayam': 'அண்டிபாளையம்',
  'Annamalainagar': 'அண்ணாமலைநகர்',
  'Anthiyur': 'அந்தியூர்',
  'Anuppanadi': 'அனுப்பநாடி',
  'Arakonam': 'அரக்கோணம்',
  'Aralvaimozhi': 'அரல்வாய்மொழி',
  'Arani': 'அரணி',
  'Arasampalayam': 'அரசம்பாளையம்',
  'Arcot': 'ஆற்காடு',
  'Arni': 'அரணி',
  'Arumbakkam': 'அரும்பாக்கம்',
  'Aruppukottai': 'அருப்புக்கோட்டை',
  'Athani': 'அத்தானி',
  'Athoor': 'அத்தூர்',
  'Attur': 'ஆத்தூர்',
  'Avadi': 'அவடி',
  'Avinashi': 'அவிநாசி',
  'Ayakudi': 'ஆயக்குடி',
  'Bargur': 'பர்கூர்',
  'Belur': 'பேலூர்',
  'Bhavanisagar': 'பவானிசாகர்',
  'Bodinayakanur': 'போடிநாயக்கனூர்',
  'Budalur': 'புதலூர்',
  'Cheranmahadevi': 'சேரன்மகாதேவி',
  'Chetpet': 'செட்பேட்',
  'Cheyyar': 'சேயாறு',
  'Cheyyur': 'சேயூர்',
  'Chinnalapatti': 'சின்னலபட்டி',
  'Chinnamanur': 'சின்னமனூர்',
  'Chinnasalem': 'சின்னசேலம்',
  'Cholavaram': 'சோளவரம்',
  'Chromepet': 'குரோம்பேட்',
  'Doraikuppam': 'தொரைக்குப்பம்',
  'Edappadi': 'இடப்பாடி',
  'Gadilam': 'கடிலம்',
  'Gangavalli': 'கங்காவல்லி',
  'Gingee': 'செஞ்சி',
  'Gobichettipalayam': 'கோபிசெட்டிபாளையம்',
  'Gudiyatham': 'குடியாத்தம்',
  'Guduvanchery': 'குடுவாஞ்சேரி',
  'Gummidipoondi': 'கும்மிடிப்பூண்டி',
  'Harur': 'அரூர்',
  'Injambakkam': 'இஞ்சம்பாக்கம்',
  'Irungattukottai': 'இருங்கட்டுக்கோட்டை',
  'Jamunamarathur': 'யமுனாமரத்தூர்',
  'Jolarpet': 'ஜோலார்பேட்',
  'Kalpakkam': 'கல்பாக்கம்',
  'Kalvarayan': 'கல்வராயன்',
  'Kangayam': 'கங்கயம்',
  'Katpadi': 'காட்பாடி',
  'Kattumannarkoil': 'கட்டுமன்னார்கோயில்',
  'Kaveripattinam': 'காவேரிப்பட்டினம்',
  'Kelambakkam': 'கேளம்பாக்கம்',
  'Kilpennathur': 'கீழ்பென்னாத்தூர்',
  'Kodaikanal': 'கொடைக்கானல்',
  'Kodumudi': 'கோடுமுடி',
  'Koilpatti': 'கோயில்பட்டி',
  'Komarapalayam': 'கோமாரபாளையம்',
  'Kotagiri': 'கோத்தகிரி',
  'Kumbakonam': 'கும்பகோணம்',
  'Kumarapalayam': 'குமாரபாளையம்',
  'Kurinjipadi': 'குறிஞ்சிப்பாடி',
  'Kuttalam': 'குற்றாலம்',
  'Lalgudi': 'லால்குடி',
  'Lathur': 'லத்தூர்',
  'Madurantakam': 'மதுராந்தகம்',
  'Mailam': 'மைலம்',
  'Mamallapuram': 'மாமல்லபுரம்',
  'Manachanallur': 'மணச்சநல்லூர்',
  'Manapparai': 'மணப்பாறை',
  'Mannargudi': 'மன்னார்குடி',
  'Marakkadai': 'மரக்கடை',
  'Marakkanam': 'மரக்காணம்',
  'Mecheri': 'மேச்சேரி',
  'Melmaruvathur': 'மேல்மருவத்தூர்',
  'Mettur': 'மேட்டூர்',
  'Mudichur': 'முடிச்சூர்',
  'Mudukulathur': 'முதுகுளத்தூர்',
  'Musiri': 'முசிறி',
  'Muthupet': 'முத்துப்பேட்',
  'Nagercoil': 'நாகர்கோயில்',
  'Nambiyur': 'நம்பியூர்',
  'Nandambakkam': 'நந்தம்பாக்கம்',
  'Natham': 'நாத்தம்',
  'Neyveli': 'நெய்வேலி',
  'Nilakottai': 'நீலக்கோட்டை',
  'Oddanchatram': 'ஒட்டன்சத்திரம்',
  'Omalur': 'ஓமலூர்',
  'Orathanadu': 'ஒற்றநாடு',
  'Palani': 'பழனி',
  'Pallavaram': 'பல்லாவரம்',
  'Panruti': 'பான்ருட்டி',
  'Papanasam': 'பாபநாசம்',
  'Pattukottai': 'பட்டுக்கோட்டை',
  'Peravurani': 'பெரவுரனி',
  'Periyakulam': 'பெரியகுளம்',
  'Perundurai': 'பெருந்துறை',
  'Polur': 'போலூர்',
  'Pollachi': 'பொள்ளாச்சி',
  'Puducherry': 'புதுச்சேரி',
  'Pullambadi': 'புல்லம்பாடி',
  'Rajapalayam': 'ராஜபாளையம்',
  'Ranipet': 'ராணிப்பேட்',
  'Rasipuram': 'ராசிபுரம்',
  'Sankarapuram': 'சங்கராபுரம்',
  'Sankari': 'சங்கரி',
  'Sathyamangalam': 'சத்தியமங்கலம்',
  'Sembakkam': 'செம்பாக்கம்',
  'Sendamangalam': 'சேந்தமங்கலம்',
  'Sholingur': 'சோளிங்கர்',
  'Sriperumbudur': 'ஸ்ரீபெரும்புதூர்',
  'Srimushnam': 'ஸ்ரீமுஷ்ணம்',
  'Srirangam': 'ஸ்ரீரங்கம்',
  'Srivilliputhur': 'ஸ்ரீவில்லிபுத்தூர்',
  'Tambaram': 'தாம்பரம்',
  'Thandrampet': 'தந்திராம்பேட்',
  'Tharamangalam': 'தாரமங்கலம்',
  'Thiruchendur': 'திருச்செந்தூர்',
  'Thirukadaiyur': 'திருக்கடையூர்',
  'Thirukkuvalai': 'திருக்குவளை',
  'Thiruneermalai': 'திருநீர்மலை',
  'Thiruparankundram': 'திருப்பரங்குன்றம்',
  'Thiruvannamalai': 'திருவண்ணாமலை',
  'Thiruvaiyaru': 'திருவையாறு',
  'Thoothukkudi': 'தூத்துக்குடி',
  'Thottiyam': 'தொட்டியம்',
  'Thuraiyur': 'துறையூர்',
  'Tindivanam': 'திண்டிவனம்',
  'Tirumangalam': 'திருமங்கலம்',
  'Tittagudi': 'திட்டகுடி',
  'Udumalaipettai': 'உடுமலைப்பேட்டை',
  'Ulundurpet': 'உளுந்தூர்பேட்',
  'Uppiliapuram': 'உப்பிலியபுரம்',
  'Usilampatti': 'உசிலம்பட்டி',
  'Uthiramerur': 'உத்திரமேரூர்',
  'Vadakkuvalliyur': 'வடக்குவள்ளியூர்',
  'Vadipatti': 'வாடிப்பட்டி',
  'Vaiyampatti': 'வையம்பட்டி',
  'Valparai': 'வால்பாறை',
  'Vandalur': 'வண்டலூர்',
  'Vandavasi': 'வந்தவாசி',
  'Vaniyambadi': 'வனியம்பாடி',
  'Vanur': 'வானூர்',
  'Vedaranyam': 'வேதாரண்யம்',
  'Vedasandur': 'வேதசந்தூர்',
  'Vikravandi': 'விக்கிரவாண்டி',
  'Virudhachalam': 'விருதாசலம்',
  'Walajabad': 'வலாஜாபாத்',
  'Yercaud': 'யேர்காடு'
};

// Function to clean area name for lookup
function cleanNameForLookup(name: string): string {
  return name
    .replace(/^\d+\s*\.?\s*/, '') // Remove number prefixes
    .replace(/\s*\(.*\)\s*$/, '') // Remove parenthetical content
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Function to check if Tamil name is problematic
function isProblematicTamilName(tamilName: string | null): boolean {
  if (!tamilName) return true;
  
  // Check for incomplete suffix-only names
  const problematicPatterns = [
    'பட்டி', 'குடி', 'புரம்', 'நகர்', 'கோட்டை', 'நல்லூர்', 
    'வாடி', 'ஊர்', 'ூர்', 'மங்கலம்', 'பாளையம்', 'கோயில்'
  ];
  
  if (problematicPatterns.includes(tamilName)) return true;
  
  // Check for garbled patterns
  if (/^(.)\1+$/.test(tamilName.replace(/[்ா௚ீு௚ூே௚ை௚ொோௌ]/g, ''))) return true;
  
  // Check for mixed English-Tamil
  if (/[a-zA-Z]/.test(tamilName) && /[\u0B80-\u0BFF]/.test(tamilName)) return true;
  
  return false;
}

// Function to generate proper Tamil name
function getProperTamilName(englishName: string): string {
  const cleanName = cleanNameForLookup(englishName);
  
  // Direct lookup
  if (comprehensiveTamilNames[cleanName]) {
    return comprehensiveTamilNames[cleanName];
  }
  
  // Case insensitive lookup
  const lowerName = cleanName.toLowerCase();
  for (const [key, value] of Object.entries(comprehensiveTamilNames)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Pattern matching with proper base names
  const patterns = [
    { suffix: 'palayam', tamil: 'பாளையம்', prefixes: ['ala', 'anna', 'koma', 'raja'] },
    { suffix: 'patti', tamil: 'பட்டி', prefixes: ['china', 'peru', 'mani', 'katu'] },
    { suffix: 'puram', tamil: 'புரம்', prefixes: ['aga', 'abhi', 'nara', 'bhu'] },
    { suffix: 'nagar', tamil: 'நகர்', prefixes: ['anna', 'sri', 'maha'] },
    { suffix: 'kottai', tamil: 'கோட்டை', prefixes: ['aru', 'pat', 'sri'] },
    { suffix: 'koil', tamil: 'கோயில்', prefixes: ['kat', 'man'] },
    { suffix: 'mangalam', tamil: 'மங்கலம்', prefixes: ['sen', 'tara', 'tiru'] },
    { suffix: 'nallur', tamil: 'நல்லூர்', prefixes: ['and', 'man'] },
    { suffix: 'thur', tamil: 'தூர்', prefixes: ['a', 'bhu', 'can'] },
    { suffix: 'ur', tamil: 'ூர்', prefixes: ['bel', 'har', 'kan'] },
    { suffix: 'kudi', tamil: 'குடி', prefixes: ['aya', 'per', 'til'] },
    { suffix: 'vadi', tamil: 'வாடி', prefixes: ['ala', 'ana'] }
  ];
  
  for (const { suffix, tamil, prefixes } of patterns) {
    if (cleanName.toLowerCase().endsWith(suffix.toLowerCase())) {
      const baseName = cleanName.substring(0, cleanName.length - suffix.length).trim();
      
      // Check if we have a translation for the base
      if (comprehensiveTamilNames[baseName]) {
        return comprehensiveTamilNames[baseName] + tamil;
      }
      
      // Use common prefix mappings for better results
      const lowerBase = baseName.toLowerCase();
      for (const prefix of prefixes) {
        if (lowerBase.startsWith(prefix)) {
          return createPhoneticTamil(baseName) + tamil;
        }
      }
      
      return createPhoneticTamil(baseName) + tamil;
    }
  }
  
  // Create phonetic Tamil for the full name
  return createPhoneticTamil(cleanName);
}

// Improved phonetic Tamil conversion
function createPhoneticTamil(englishName: string): string {
  const phoneticMap: Record<string, string> = {
    // Vowels
    'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ii': 'ஈ', 'u': 'உ', 'uu': 'ஊ',
    'e': 'எ', 'ee': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oo': 'ஓ', 'au': 'ஔ',
    
    // Consonants with vowels
    'ka': 'க', 'ga': 'க', 'kha': 'க', 'gha': 'க',
    'cha': 'ச', 'ja': 'ஜ', 'jha': 'ஜ',
    'ta': 'த', 'da': 'த', 'tha': 'த', 'dha': 'த',
    'na': 'ன', 'pa': 'ப', 'ba': 'ப', 'pha': 'ப', 'bha': 'ப',
    'ma': 'ம', 'ya': 'ய', 'ra': 'ர', 'la': 'ல', 'va': 'வ',
    'sha': 'ஷ', 'sa': 'ச', 'ha': 'ஹ', 'za': 'ஸ',
    
    // Common combinations
    'nda': 'ண்ட', 'nta': 'ந்த', 'nga': 'ங்க', 'nja': 'ஞ்ச',
    'mba': 'ம்ப', 'mpa': 'ம்ப', 'lla': 'ல்ல', 'nna': 'ன்ன',
    'tta': 'த்த', 'kka': 'க்க', 'ppa': 'ப்ப'
  };
  
  let result = '';
  const name = englishName.toLowerCase();
  let i = 0;
  
  while (i < name.length) {
    if (name[i] === ' ') {
      result += ' ';
      i++;
      continue;
    }
    
    // Try 3-letter combinations first
    if (i + 2 < name.length) {
      const threeLetter = name.substring(i, i + 3);
      if (phoneticMap[threeLetter]) {
        result += phoneticMap[threeLetter];
        i += 3;
        continue;
      }
    }
    
    // Try 2-letter combinations
    if (i + 1 < name.length) {
      const twoLetter = name.substring(i, i + 2);
      if (phoneticMap[twoLetter]) {
        result += phoneticMap[twoLetter];
        i += 2;
        continue;
      }
    }
    
    // Single letter
    const singleLetter = name[i] + 'a'; // Add 'a' for consonants
    if (phoneticMap[singleLetter]) {
      result += phoneticMap[singleLetter];
    } else if (phoneticMap[name[i]]) {
      result += phoneticMap[name[i]];
    } else {
      result += name[i];
    }
    i++;
  }
  
  return result;
}

async function comprehensivelyFixAllTamilNames() {
  try {
    console.log('Starting comprehensive Tamil name fixes for all areas...');
    
    // Get all areas with problematic Tamil names
    const allAreas = await db.select().from(areas);
    console.log(`Checking all ${allAreas.length} areas...`);
    
    let processedCount = 0;
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const area of allAreas) {
      try {
        if (isProblematicTamilName(area.tamilName)) {
          const properTamilName = getProperTamilName(area.name);
          
          if (properTamilName && properTamilName !== area.tamilName) {
            await db.update(areas)
              .set({ tamilName: properTamilName })
              .where(eq(areas.id, area.id));
            
            fixedCount++;
            console.log(`FIXED: ${area.name}: "${area.tamilName}" → "${properTamilName}"`);
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
        
        processedCount++;
        
        if (processedCount % 500 === 0) {
          console.log(`Progress: ${processedCount}/${allAreas.length} processed, ${fixedCount} fixed...`);
        }
        
      } catch (error) {
        console.error(`Error processing ${area.name}:`, error);
        skippedCount++;
        processedCount++;
      }
    }
    
    console.log('\n=== Comprehensive Tamil Fix Summary ===');
    console.log(`Total areas processed: ${processedCount}`);
    console.log(`Areas fixed with proper Tamil names: ${fixedCount}`);
    console.log(`Areas skipped (already correct): ${skippedCount}`);
    
    console.log('\nComprehensive Tamil name fixes completed successfully!');
    
  } catch (error) {
    console.error('Error during comprehensive Tamil fixes:', error);
  }
}

// Run the comprehensive fix
comprehensivelyFixAllTamilNames();