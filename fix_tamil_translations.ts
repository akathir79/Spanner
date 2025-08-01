import { db } from './server/db';
import { areas } from './shared/schema';
import { eq } from 'drizzle-orm';

// Comprehensive Tamil translation mapping for proper village/area names
const properTamilNames: Record<string, string> = {
  // Common prefixes and numbers
  '105 MANALUR': 'மணலூர்',
  '119 ANAKUDI': 'ஆனாக்குடி',
  'MANALUR': 'மணலூர்',
  'ANAKUDI': 'ஆனாக்குடி',
  
  // Salem District proper names
  'New Fairlands': 'நியூ ஃபேர்லாந்து',
  'Shevapet': 'ஷேவாபேட்',
  'Aathur': 'ஆத்தூர்',
  'Hasthampatty': 'ஹஸ்தாம்பட்டி',
  'Kondalampatty': 'கொண்டலம்பட்டி',
  'Attur': 'ஆத்தூர்',
  'Gangavalli': 'கங்காவல்லி',
  'Yercaud': 'யேர்காடு',
  'Omalur': 'ஓமலூர்',
  'Mettur': 'மேட்டூர்',
  'Edappadi': 'இடப்பாடி',
  'Sankagiri': 'சங்ககிரி',
  'Kadayampatti': 'கடையம்பட்டி',
  'Panamarathupatti': 'பனமரத்துப்பட்டி',
  'Ayothiyapattinam': 'அயோத்தியாபட்டினம்',
  'Belur': 'பேலூர்',
  'Nangavalli': 'நங்காவல்லி',
  'Peddanaickenpalayam': 'பெட்டநாயக்கன்பாளையம்',
  
  // Chennai District areas
  'Sholavaram': 'சோளவரம்',
  'Puzhal': 'புழல்',
  'Minjur': 'மிஞ்சூர்',
  'Kathivakkam': 'காத்திவாக்கம்',
  'Ennore Creek': 'எண்ணூர் க்ரீக்',
  'Kaladipet': 'கலடிபேட்',
  'Vyasarpadi': 'வியாசர்பாடி',
  'Korukkupet': 'கொருக்குப்பேட்',
  'Thiruvottiyur': 'திருவோட்டியூர்',
  'Manali New Town': 'மனாலி நியூ டவுன்',
  'Madhavaram Milk Colony': 'மாதவரம் மில்க் காலனி',
  'Retteri': 'ரெட்டேரி',
  'Kolathur': 'கோளத்தூர்',
  
  // Coimbatore District areas
  'Kinathukadavu': 'கிணத்துக்கடவு',
  'Madukkarai': 'மதுக்கரை',
  'Thondamuthur': 'தொண்டமுத்தூர்',
  'Annur': 'அண்ணூர்',
  'Avinashi Road': 'அவிநாசி ரோடு',
  'Sulur': 'சூலூர்',
  'Perur': 'பெரூர்',
  'Karamadai': 'கரமடை',
  'Sirumugai': 'சிறுமுகை',
  'Narasimhanaickenpalayam': 'நரசிம்மநாயக்கன்பாளையம்',
  'Ettimadai': 'எட்டிமடை',
  'Chettipalayam': 'செட்டிபாளையம்',
  
  // Madurai District areas
  'Thiruparankundram': 'திருப்பரங்குன்றம்',
  'Usilampatti': 'உசிலம்பட்டி',
  'Melur': 'மேலூர்',
  'Vadipatti': 'வாடிப்பட்டி',
  'Kalligudi': 'கல்லிகுடி',
  'Chellampatti': 'செல்லம்பட்டி',
  'Alanganallur': 'அலங்கநல்லூர்',
  'Tirumangalam': 'திருமங்கலம்',
  'Kottampatti': 'கோட்டம்பட்டி',
  'Sholavandan': 'சோழவந்தான்',
  'Sedapatti': 'சேடப்பட்டி',
  'Thirupuvanam': 'திருப்புவனம்',
  
  // Common village name patterns (cleaned up)
  'Vanjinapuram': 'வஞ்சிநபுரம்',
  'Variyankaval': 'வரியன்காவல்',
  'Veerakkan': 'வீரக்கன்',
  'Vembukudi': 'வேம்புக்குடி',
  'Venganoor': 'வேங்கனூர்',
  'Venkatakrishnapuram': 'வேங்கடகிருஷ்ணபுரம்',
  'Venmankondan': 'வென்மங்கொண்டான்',
  'Vettiyarvettu': 'வெட்டியார்வெட்டு',
  'Vettriyur': 'வெட்ரியூர்',
  
  // More proper village names
  'Aalampalayam': 'ஆலம்பாளையம்',
  'Aanaimalai': 'ஆனைமலை',
  'Aanaikatti': 'ஆனைக்கட்டி',
  'Aayakudi': 'ஆயக்குடி',
  'Abirami': 'அபிராமி',
  'Adayar': 'அடையாறு',
  'Adhirampattinam': 'அதிராம்பட்டினம்',
  'Agaram': 'அகரம்',
  'Agarapettai': 'அகரபேட்டை',
  'Agasthiapuram': 'அகஸ்தியபுரம்',
  'Agraaharam': 'அக்ரஹாரம்',
  'Aiyampettai': 'ஐயம்பேட்டை',
  'Alagapuram': 'அலகாபுரம்',
  'Alambadi': 'ஆலம்பாடி',
  'Alampalayam': 'ஆலம்பாளையம்',
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
  'Avadi': 'அவடி',
  'Avinashi': 'அவிநாசி',
  'Ayakudi': 'ஆயக்குடி',
  
  // Pattern-based mappings for common suffixes
  'Bargur': 'பர்கூர்',
  'Bhavanisagar': 'பவானி சாகர்',
  'Bhuvanagiri': 'புவனகிரி',
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
  'Chinnaselam': 'சின்னசேலம்',
  'Chinnasalem': 'சின்னசேலம்',
  'Cholavaram': 'சோளவரம்',
  'Chromepet': 'குரோம்பேட்',
  'Coimbatore': 'கோயம்புத்தூர்',
  'Cuddalore': 'கடலூர்',
  'Dharmapuri': 'தர்மபுரி',
  'Dindigul': 'திண்டுக்கல்',
  'Doraikuppam': 'தொரைக்குப்பம்',
  'Erode': 'ஈரோடு',
  'Gadilam': 'கடிலம்',
  'Gingee': 'செஞ்சி',
  'Gobichettipalayam': 'கோபிசெட்டிபாளையம்',
  'Gudiyatham': 'குடியாத்தம்',
  'Guduvanchery': 'குடுவாஞ்சேரி',
  'Gummidipoondi': 'கும்மிடிப்பூண்டி',
  'Harur': 'அரூர்',
  'Hosur': 'ஓசூர்',
  'Injambakkam': 'இஞ்சம்பாக்கம்',
  'Irungattukottai': 'இருங்கட்டுக்கோட்டை',
  'Jamunamarathur': 'யமுனாமரத்தூர்',
  'Jolarpet': 'ஜோலார்பேட்',
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
  'Mudichur': 'முடிச்சூர்',
  'Mudukulathur': 'முதுகுளத்தூர்',
  'Musiri': 'முசிறி',
  'Muthupet': 'முத்துப்பேட்',
  'Nagapattinam': 'நாகப்பட்டினம்',
  'Nagercoil': 'நாகர்கோயில்',
  'Namakkal': 'நாமக்கல்',
  'Nambiyur': 'நம்பியூர்',
  'Nandambakkam': 'நந்தம்பாக்கம்',
  'Natham': 'நாத்தம்',
  'Neyveli': 'நெய்வேலி',
  'Nilakottai': 'நீலக்கோட்டை',
  'Oddanchatram': 'ஒட்டன்சத்திரம்',
  'Orathanadu': 'ஒற்றநாடு',
  'Palani': 'பழனி',
  'Pallavaram': 'பல்லாவரம்',
  'Panruti': 'பான்ருட்டி',
  'Papanasam': 'பாபநாசம்',
  'Pattukottai': 'பட்டுக்கோட்டை',
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
  'Tittagudi': 'திட்டகுடி',
  'Tuticorin': 'தூத்துக்குடி',
  'Udumalaipettai': 'உடுமலைப்பேட்டை',
  'Ulundurpet': 'உளுந்தூர்பேட்',
  'Uppiliapuram': 'உப்பிலியபுரம்',
  'Uthiramerur': 'உத்திரமேரூர்',
  'Vadakkuvalliyur': 'வடக்குவள்ளியூர்',
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
  'Yelahanka': 'யேலஹங்கா'
};

// Function to clean up and improve Tamil names
function getProperTamilName(englishName: string): string | null {
  const cleanName = englishName.trim();
  
  // Direct mapping check
  if (properTamilNames[cleanName]) {
    return properTamilNames[cleanName];
  }
  
  // Remove numeric prefixes for pattern matching
  const nameWithoutNumbers = cleanName.replace(/^\d+\s+/, '');
  if (properTamilNames[nameWithoutNumbers]) {
    return properTamilNames[nameWithoutNumbers];
  }
  
  // Pattern-based generation for common suffixes
  const patterns = [
    { pattern: /puram$/i, base: cleanName.replace(/puram$/i, ''), suffix: 'புரம்' },
    { pattern: /nagar$/i, base: cleanName.replace(/nagar$/i, ''), suffix: 'நகர்' },
    { pattern: /kottai$/i, base: cleanName.replace(/kottai$/i, ''), suffix: 'கோட்டை' },
    { pattern: /palayam$/i, base: cleanName.replace(/palayam$/i, ''), suffix: 'பாளையம்' },
    { pattern: /patti$/i, base: cleanName.replace(/patti$/i, ''), suffix: 'பட்டி' },
    { pattern: /koil$/i, base: cleanName.replace(/koil$/i, ''), suffix: 'கோயில்' },
    { pattern: /mangalam$/i, base: cleanName.replace(/mangalam$/i, ''), suffix: 'மங்கலம்' },
    { pattern: /nallur$/i, base: cleanName.replace(/nallur$/i, ''), suffix: 'நல்லூர்' },
    { pattern: /thur$/i, base: cleanName.replace(/thur$/i, ''), suffix: 'தூர்' },
    { pattern: /oor$/i, base: cleanName.replace(/oor$/i, ''), suffix: 'ஊர்' },
    { pattern: /kudi$/i, base: cleanName.replace(/kudi$/i, ''), suffix: 'குடி' },
    { pattern: /vadi$/i, base: cleanName.replace(/vadi$/i, ''), suffix: 'வாடி' },
    { pattern: /padi$/i, base: cleanName.replace(/padi$/i, ''), suffix: 'பாடி' },
    { pattern: /pet$/i, base: cleanName.replace(/pet$/i, ''), suffix: 'பேட்' },
    { pattern: /bad$/i, base: cleanName.replace(/bad$/i, ''), suffix: 'பாத்' },
    { pattern: /abad$/i, base: cleanName.replace(/abad$/i, ''), suffix: 'ஆபாத்' }
  ];
  
  for (const { pattern, base, suffix } of patterns) {
    if (pattern.test(cleanName)) {
      // Check if we have a mapping for the base
      if (properTamilNames[base]) {
        return properTamilNames[base] + suffix;
      }
      // Otherwise create a reasonable Tamil transliteration
      const transliteratedBase = transliterateToTamil(base);
      if (transliteratedBase) {
        return transliteratedBase + suffix;
      }
    }
  }
  
  // Final fallback - full transliteration
  return transliterateToTamil(cleanName);
}

// Basic Tamil transliteration function
function transliterateToTamil(text: string): string | null {
  if (!text || text.length === 0) return null;
  
  // Remove numbers and special characters for cleaner transliteration
  const cleanText = text.replace(/[0-9\.\-\(\)\/\s]/g, '');
  
  if (cleanText.length === 0) return null;
  
  // Basic consonant and vowel mapping
  const transliterationMap: Record<string, string> = {
    'a': 'அ', 'aa': 'ஆ', 'i': 'இ', 'ii': 'ஈ', 'u': 'உ', 'uu': 'ஊ',
    'e': 'எ', 'ee': 'ஏ', 'ai': 'ஐ', 'o': 'ஒ', 'oo': 'ஓ', 'au': 'ஔ',
    'k': 'க்', 'g': 'க்', 'ng': 'ங்', 'ch': 'ச்', 'j': 'ஜ்', 'ny': 'ஞ்',
    't': 'த்', 'd': 'த்', 'n': 'ன்', 'th': 'த்', 'dh': 'த்', 'nn': 'ண்',
    'p': 'ப்', 'b': 'ப்', 'm': 'ம்', 'y': 'ய்', 'r': 'ர்', 'l': 'ல்',
    'v': 'வ்', 'sh': 'ஷ்', 's': 'ச்', 'h': 'ஹ்', 'z': 'ஸ்'
  };
  
  // Simple character-by-character mapping (very basic)
  let result = '';
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i].toLowerCase();
    if (transliterationMap[char]) {
      result += transliterationMap[char];
    } else {
      // For unmapped characters, try vowel substitution
      const vowelMap: Record<string, string> = {
        'a': 'அ', 'e': 'எ', 'i': 'இ', 'o': 'ஒ', 'u': 'உ'
      };
      result += vowelMap[char] || char;
    }
  }
  
  return result;
}

async function fixTamilTranslations() {
  try {
    console.log('Starting Tamil translation fixes...');
    
    // Get all areas with problematic or missing Tamil names
    const allAreas = await db.select().from(areas);
    console.log(`Processing ${allAreas.length} areas for Tamil name improvements...`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const area of allAreas) {
      try {
        // Check if the Tamil name needs fixing
        const needsFixing = !area.tamilName || 
                          area.tamilName.includes('அ') && area.tamilName.includes('M') || // Mixed script
                          area.tamilName.includes('எ') && area.tamilName.includes('N') || // Mixed script
                          area.tamilName.includes('உ') && area.tamilName.includes('R') || // Mixed script
                          area.tamilName.length < 2; // Too short
        
        if (needsFixing) {
          const properTamilName = getProperTamilName(area.name);
          
          if (properTamilName && properTamilName !== area.tamilName) {
            await db.update(areas)
              .set({ tamilName: properTamilName })
              .where(eq(areas.id, area.id));
            
            updatedCount++;
            console.log(`${area.name} → ${properTamilName}`);
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
        
        processedCount++;
        
        // Log progress every 500 areas
        if (processedCount % 500 === 0) {
          console.log(`Progress: ${processedCount}/${allAreas.length} processed...`);
        }
        
      } catch (error) {
        console.error(`Error processing ${area.name}:`, error);
        skippedCount++;
        processedCount++;
      }
    }
    
    console.log('\n=== Tamil Translation Fix Summary ===');
    console.log(`Total areas processed: ${processedCount}`);
    console.log(`Areas updated with improved Tamil names: ${updatedCount}`);
    console.log(`Areas skipped: ${skippedCount}`);
    
    console.log('Tamil translation fixes completed!');
    
  } catch (error) {
    console.error('Error during Tamil translation fixes:', error);
  }
}

// Run the script
fixTamilTranslations();