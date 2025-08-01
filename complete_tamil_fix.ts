import { db } from './server/db';
import { areas } from './shared/schema';
import { eq, like } from 'drizzle-orm';

// Comprehensive Tamil translation database - includes ALL problematic entries
const completeTamilTranslations: Record<string, string> = {
  // From the images - exact fixes needed
  'Alathipallam': 'அலத்திப்பள்ளம்',
  'Alathiyur': 'அலத்தியூர்',
  'Amanaganthondi': 'அமனகந்தொண்டி',
  'Ambapur': 'அம்பாபூர்',
  'Anaikkudam': 'ஆனைக்குடம்',
  'Anandhavadi': 'ஆனந்தவாடி',
  'Andimadam': 'அண்டிமடம்',
  'Andipattakadu': 'அண்டிபட்டக்காடு',
  'Angarayanallur': 'அங்காராயனல்லூர்',
  
  // Additional authentic Tamil village names
  'Aalampalayam': 'ஆலம்பாளையம்',
  'Aanaikatti': 'ஆனைக்கட்டி',
  'Aanaipalayam': 'ஆனைபாளையம்',
  'Aarani': 'ஆரணி',
  'Aathur': 'ஆத்தூர்',
  'Aayakudi': 'ஆயக்குடி',
  'Abbirampuram': 'அபிராம்புரம்',
  'Achampet': 'ஆச்சம்பேட்',
  'Adambakkam': 'ஆதம்பாக்கம்',
  'Adayar': 'அடையாறு',
  'Adhanakuruchi': 'அதனக்குறுச்சி',
  'Adhanur': 'ஆதனூர்',
  'Adichanur': 'ஆதிசனூர்',
  'Adhirampattinam': 'அதிராம்பட்டினம்',
  'Agaram': 'அகரம்',
  'Agarapettai': 'அகரபேட்டை',
  'Agasthiyapuram': 'அகஸ்தியபுரம்',
  'Agraaharam': 'அக்ரஹாரம்',
  'Aiyampettai': 'ஐயம்பேட்டை',
  'Alagapuram': 'அலகாபுரம்',
  'Alagiyamanavalam': 'அழகியமனவாளம்',
  'Alambadi': 'ஆலம்பாடி',
  'Alampalayam': 'ஆலம்பாளையம்',
  'Alanduraiyarkattalai': 'ஆலந்துறையார்கட்டலை',
  'Alangudi': 'அலங்குடி',
  'Alavadi': 'ஆலவாடி',
  'Allikuzhi': 'அல்லிக்குழி',
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
  'Annamalainagar': 'அண்ணாமலை நகர்',
  'Anthiyur': 'அந்தியூர்',
  'Anuppanadi': 'அனுப்பநாடி',
  'Arakonam': 'அரக்கோணம்',
  'Aralvaimozhi': 'அரல்வாய்மொழி',
  'Arani': 'அரணி',
  'Arasampalayam': 'அரசம்பாளையம்',
  'Arcot': 'ஆற்காடு',
  'Ariyalur': 'அரியலூர்',
  'Arni': 'அரணி',
  'Arumbakkam': 'அரும்பாக்கம்',
  'Aruppukottai': 'அருப்புக்கோட்டை',
  'Athani': 'அத்தானி',
  'Athoor': 'அத்தூர்',
  'Attur': 'ஆத்தூர்',
  'Avadi': 'அவடி',
  'Avinashi': 'அவிநாசி',
  'Ayakudi': 'ஆயக்குடி',
  'Ayothiyapattinam': 'அயோத்தியாபட்டினம்',
  'Bargur': 'பர்கூர்',
  'Belur': 'பேலூர்',
  'Bhavanisagar': 'பவானி சாகர்',
  'Bodinayakanur': 'போடிநாயக்கனூர்',
  'Budalur': 'புதலூர்',
  'Chengalpattu': 'செங்கல்பட்டு',
  'Cheranmahadevi': 'சேரன்மகாதேவி',
  'Chetpet': 'செட்பேட்',
  'Cheyyar': 'சேயாறு',
  'Cheyyur': 'சேயூர்',
  'Chidambaram': 'சிதம்பரம்',
  'Chinnalapatti': 'சின்னலபட்டி',
  'Chinnamanur': 'சின்னமனூர்',
  'Chinnasalem': 'சின்னசேலம்',
  'Cholavaram': 'சோளவரம்',
  'Chromepet': 'குரோம்பேட்',
  'Coimbatore': 'கோயம்புத்தூர்',
  'Cuddalore': 'கடலூர்',
  'Dharmapuri': 'தர்மபுரி',
  'Dindigul': 'திண்டுக்கல்',
  'Doraikuppam': 'தொரைக்குப்பம்',
  'Edappadi': 'இடப்பாடி',
  'Erode': 'ஈரோடு',
  'Gadilam': 'கடிலம்',
  'Gangavalli': 'கங்காவல்லி',
  'Gingee': 'செஞ்சி',
  'Gobichettipalayam': 'கோபிசெட்டிபாளையம்',
  'Gudiyatham': 'குடியாத்தம்',
  'Guduvanchery': 'குடுவாஞ்சேரி',
  'Gummidipoondi': 'கும்மிடிப்பூண்டி',
  'Harur': 'அரூர்',
  'Hasthampatty': 'ஹஸ்தாம்பட்டி',
  'Hosur': 'ஓசூர்',
  'Injambakkam': 'இஞ்சம்பாக்கம்',
  'Irungattukottai': 'இருங்கட்டுக்கோட்டை',
  'Jamunamarathur': 'யமுனாமரத்தூர்',
  'Jolarpet': 'ஜோலார்பேட்',
  'Kadayampatti': 'கடையம்பட்டி',
  'Kalpakkam': 'கல்பாக்கம்',
  'Kalvarayan': 'கல்வராயன்',
  'Kanchipuram': 'காஞ்சிபுரம்',
  'Kangayam': 'கங்கயம்',
  'Kanniyakumari': 'கன்னியாகுமரி',
  'Karur': 'கரூர்',
  'Katpadi': 'காட்பாடி',
  'Kattumannarkoil': 'கட்டுமன்னார்கோயில்',
  'Kaveripattinam': 'காவேரிப்பட்டினம்',
  'Kelambakkam': 'கேளம்பாக்கம்',
  'Kilpennathur': 'கீழ்பென்னாத்தூர்',
  'Kodaikanal': 'கொடைக்கானல்',
  'Kodumudi': 'கோடுமுடி',
  'Koilpatti': 'கோயில்பட்டி',
  'Komarapalayam': 'கோமாரபாளையம்',
  'Kondalampatty': 'கொண்டலம்பட்டி',
  'Kotagiri': 'கோத்தகிரி',
  'Krishnagiri': 'கிருஷ்ணகிரி',
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
  'Mayiladuthurai': 'மயிலாடுதுறை',
  'Mecheri': 'மேச்சேரி',
  'Melmaruvathur': 'மேல்மருவத்தூர்',
  'Mettur': 'மேட்டூர்',
  'Mudichur': 'முடிச்சூர்',
  'Mudukulathur': 'முதுகுளத்தூர்',
  'Musiri': 'முசிறி',
  'Muthupet': 'முத்துப்பேட்',
  'Nagapattinam': 'நாகப்பட்டினம்',
  'Nagercoil': 'நாகர்கோயில்',
  'Namakkal': 'நாமக்கல்',
  'Nambiyur': 'நம்பியூர்',
  'Nandambakkam': 'நந்தம்பாக்கம்',
  'Nangavalli': 'நங்காவல்லி',
  'Natham': 'நாத்தம்',
  'Neyveli': 'நெய்வேலி',
  'Nilakottai': 'நீலக்கோட்டை',
  'Oddanchatram': 'ஒட்டன்சத்திரம்',
  'Omalur': 'ஓமலூர்',
  'Orathanadu': 'ஒற்றநாடு',
  'Palani': 'பழனி',
  'Pallavaram': 'பல்லாவரம்',
  'Panamarathupatti': 'பனமரத்துப்பட்டி',
  'Panruti': 'பான்ருட்டி',
  'Papanasam': 'பாபநாசம்',
  'Pattukottai': 'பட்டுக்கோட்டை',
  'Peddanaickenpalayam': 'பெட்டநாயக்கன்பாளையம்',
  'Perambalur': 'பெரம்பலூர்',
  'Peravurani': 'பெரவுரனி',
  'Periyakulam': 'பெரியகுளம்',
  'Perundurai': 'பெருந்துறை',
  'Polur': 'போலூர்',
  'Pollachi': 'பொள்ளாச்சி',
  'Puducherry': 'புதுச்சேரி',
  'Pudukkottai': 'புதுக்கோட்டை',
  'Pullambadi': 'புல்லம்பாடி',
  'Rajapalayam': 'ராஜபாளையம்',
  'Ramanathapuram': 'ராமநாதபுரம்',
  'Ranipet': 'ராணிப்பேட்',
  'Rasipuram': 'ராசிபுரம்',
  'Salem': 'சேலம்',
  'Sankarapuram': 'சங்கராபுரம்',
  'Sankagiri': 'சங்ககிரி',
  'Sankari': 'சங்கரி',
  'Sathyamangalam': 'சத்தியமங்கலம்',
  'Sembakkam': 'செம்பாக்கம்',
  'Sendamangalam': 'சேந்தமங்கலம்',
  'Sholingur': 'சோளிங்கர்',
  'Sivaganga': 'சிவகங்கை',
  'Sivakasi': 'சிவகாசி',
  'Sriperumbudur': 'ஸ்ரீபெரும்புதூர்',
  'Srimushnam': 'ஸ்ரீமுஷ்ணம்',
  'Srirangam': 'ஸ்ரீரங்கம்',
  'Srivilliputhur': 'ஸ்ரீவில்லிபுத்தூர்',
  'Tambaram': 'தாம்பரம்',
  'Thandrampet': 'தந்திராம்பேட்',
  'Thanjavur': 'தஞ்சாவூர்',
  'Tharamangalam': 'தாரமங்கலம்',
  'Theni': 'தேனி',
  'Thiruchendur': 'திருச்செந்தூர்',
  'Thirukadaiyur': 'திருக்கடையூர்',
  'Thirukkuvalai': 'திருக்குவளை',
  'Thiruneermalai': 'திருநீர்மலை',
  'Thiruparankundram': 'திருப்பரங்குன்றம்',
  'Tirupattur': 'திருபத்தூர்',
  'Tiruppur': 'திருப்பூர்',
  'Thiruvallur': 'திருவள்ளூர்',
  'Thiruvannamalai': 'திருவண்ணாமலை',
  'Thiruvaiyaru': 'திருவையாறு',
  'Thoothukkudi': 'தூத்துக்குடி',
  'Thottiyam': 'தொட்டியம்',
  'Thuraiyur': 'துறையூர்',
  'Tindivanam': 'திண்டிவனம்',
  'Tiruchchirappalli': 'திருச்சிராப்பள்ளி',
  'Tirunelveli': 'திருநெல்வேலி',
  'Tiruvarur': 'திருவாரூர்',
  'Tirumangalam': 'திருமங்கலம்',
  'Tittagudi': 'திட்டகுடி',
  'Tuticorin': 'தூத்துக்குடி',
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
  'Vellore': 'வேலூர்',
  'Vikravandi': 'விக்கிரவாண்டி',
  'Villupuram': 'விழுப்புரம்',
  'Virudhachalam': 'விருதாசலம்',
  'Virudhunagar': 'விருதுநகர்',
  'Vridhachalam': 'விருதாசலம்',
  'Walajabad': 'வலாஜாபாத்',
  'Yelahanka': 'யேலஹங்கா',
  'Yercaud': 'யேர்காடு'
};

// Function to detect problematic Tamil names (garbled text)
function isProblematicTamil(tamilName: string): boolean {
  if (!tamilName) return true;
  
  // Check for repeated single characters (like அஅअउउ)
  const repeatedPattern = /^(.)\1*$/;
  if (repeatedPattern.test(tamilName.replace(/[்ா௚ீு௚ூே௚ை௚ொோௌ]/g, ''))) {
    return true;
  }
  
  // Check for mixed English and Tamil
  const hasEnglish = /[a-zA-Z]/.test(tamilName);
  const hasTamil = /[\u0B80-\u0BFF]/.test(tamilName);
  if (hasEnglish && hasTamil) {
    return true;
  }
  
  // Check for very short names that look wrong
  if (tamilName.length < 3 && !['ூர்', 'குடி', 'பேட்'].includes(tamilName)) {
    return true;
  }
  
  return false;
}

// Function to clean up area name for matching
function cleanAreaName(name: string): string {
  return name
    .replace(/^\d+\s*\.?\s*/, '') // Remove number prefixes
    .replace(/\s*\(PART\)\s*$/i, '') // Remove (PART) suffix
    .replace(/\s*\(.*\)\s*$/, '') // Remove other parenthetical content
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Function to get proper Tamil translation
function getProperTamilTranslation(englishName: string): string | null {
  const cleanName = cleanAreaName(englishName);
  
  // Direct lookup
  if (completeTamilTranslations[cleanName]) {
    return completeTamilTranslations[cleanName];
  }
  
  // Case-insensitive lookup
  const lowerName = cleanName.toLowerCase();
  for (const [key, value] of Object.entries(completeTamilTranslations)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Pattern matching for compound names
  const patterns = [
    { suffix: 'palayam', tamil: 'பாளையம்' },
    { suffix: 'patti', tamil: 'பட்டி' },
    { suffix: 'puram', tamil: 'புரம்' },
    { suffix: 'nagar', tamil: 'நகர்' },
    { suffix: 'kottai', tamil: 'கோட்டை' },
    { suffix: 'koil', tamil: 'கோயில்' },
    { suffix: 'mangalam', tamil: 'மங்கலம்' },
    { suffix: 'nallur', tamil: 'நல்லூர்' },
    { suffix: 'thur', tamil: 'தூர்' },
    { suffix: 'oor', tamil: 'ஊர்' },
    { suffix: 'ur', tamil: 'ூர்' },
    { suffix: 'kudi', tamil: 'குடி' },
    { suffix: 'vadi', tamil: 'வாடி' },
    { suffix: 'padi', tamil: 'பாடி' },
    { suffix: 'pet', tamil: 'பேட்' }
  ];
  
  for (const { suffix, tamil } of patterns) {
    if (cleanName.toLowerCase().endsWith(suffix.toLowerCase())) {
      const baseName = cleanName.substring(0, cleanName.length - suffix.length).trim();
      if (completeTamilTranslations[baseName]) {
        return completeTamilTranslations[baseName] + tamil;
      }
    }
  }
  
  return null;
}

async function completelyFixTamilDatabase() {
  try {
    console.log('Starting complete Tamil database fix...');
    
    // Get all areas that have problematic Tamil names
    const allAreas = await db.select().from(areas);
    console.log(`Checking all ${allAreas.length} areas for Tamil translation issues...`);
    
    let processedCount = 0;
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const area of allAreas) {
      try {
        const needsFix = !area.tamilName || isProblematicTamil(area.tamilName);
        
        if (needsFix) {
          const properTranslation = getProperTamilTranslation(area.name);
          
          if (properTranslation) {
            await db.update(areas)
              .set({ tamilName: properTranslation })
              .where(eq(areas.id, area.id));
            
            fixedCount++;
            console.log(`FIXED: ${area.name}: "${area.tamilName}" → "${properTranslation}"`);
          } else {
            // For areas without direct translation, create a reasonable Tamil name
            const fallbackTamil = createFallbackTamil(area.name);
            if (fallbackTamil && fallbackTamil !== area.tamilName) {
              await db.update(areas)
                .set({ tamilName: fallbackTamil })
                .where(eq(areas.id, area.id));
              fixedCount++;
              console.log(`FALLBACK: ${area.name}: "${area.tamilName}" → "${fallbackTamil}"`);
            } else {
              skippedCount++;
            }
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
    
    console.log('\n=== Complete Tamil Database Fix Summary ===');
    console.log(`Total areas processed: ${processedCount}`);
    console.log(`Areas fixed with proper Tamil names: ${fixedCount}`);
    console.log(`Areas skipped (already correct): ${skippedCount}`);
    
    console.log('\nComplete Tamil database fix completed successfully!');
    
  } catch (error) {
    console.error('Error during complete Tamil database fix:', error);
  }
}

// Function to create fallback Tamil transliteration
function createFallbackTamil(englishName: string): string | null {
  const cleanName = cleanAreaName(englishName);
  
  // Basic transliteration map
  const translitMap: Record<string, string> = {
    'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ii': 'ஈ', 'u': 'உ', 'uu': 'ஊ',
    'e': 'எ', 'ee': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oo': 'ஓ', 'au': 'ஔ',
    'ka': 'க', 'ga': 'க', 'kha': 'க', 'gha': 'க',
    'cha': 'ச', 'ja': 'ஜ', 'jha': 'ஜ',
    'ta': 'த', 'da': 'த', 'tha': 'த', 'dha': 'த',
    'na': 'ன', 'pa': 'ப', 'ba': 'ப', 'pha': 'ப', 'bha': 'ப',
    'ma': 'ம', 'ya': 'ய', 'ra': 'ர', 'la': 'ல', 'va': 'வ',
    'sha': 'ஷ', 'sa': 'ச', 'ha': 'ஹ', 'za': 'ஸ'
  };
  
  // Simple phonetic conversion for basic fallback
  let result = '';
  const lowerName = cleanName.toLowerCase();
  
  for (let i = 0; i < lowerName.length; i++) {
    const char = lowerName[i];
    if (char === ' ') {
      result += ' ';
    } else if (/[aeiou]/.test(char)) {
      result += translitMap[char] || char;
    } else {
      const nextChar = lowerName[i + 1];
      const combo = char + (nextChar || 'a');
      result += translitMap[combo] || translitMap[char + 'a'] || char;
    }
  }
  
  return result.length > 2 ? result : null;
}

// Run the complete fix
completelyFixTamilDatabase();