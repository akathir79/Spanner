import { db } from './server/db';
import { areas } from './shared/schema';
import { eq } from 'drizzle-orm';

// Comprehensive mapping for fixing mixed script Tamil names
const properTamilTranslations: Record<string, string> = {
  // From the image - fix these specific problematic names
  'Kamarasavalli': 'கமராசவல்லி',
  'Kandarathitham': 'கந்தராதித்தம்',
  'Karaikurichi': 'கரைக்குறிச்சி',
  'Karaivetti': 'கரைவெட்டி',
  'Karkudi': 'கார்குடி',
  'Karupilakkattalai': 'கருப்பிலக்கட்டலை',
  'Kasankottai': 'கசான்கோட்டை',
  'Kathigamanal': 'காத்திகமனல்',
  
  // Additional problematic names that need fixing
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
  'Attur': 'ஆத்தூர்',
  'Avadi': 'அவடி',
  'Avinashi': 'அவிநாசி',
  'Ayakudi': 'ஆயக்குடி',
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

// Function to detect and fix mixed script issues
function hasEnglishInTamil(text: string): boolean {
  // Check if Tamil text contains English letters
  const englishPattern = /[a-zA-Z]/;
  const tamilPattern = /[\u0B80-\u0BFF]/;
  
  return englishPattern.test(text) && tamilPattern.test(text);
}

// Function to clean Tamil text by removing English characters
function cleanTamilText(text: string): string {
  if (!text) return '';
  
  // Remove all English letters and numbers from Tamil text
  return text.replace(/[a-zA-Z0-9\.\-\(\)\/\s]/g, '').trim();
}

// Function to get proper Tamil name
function getProperTamilName(englishName: string, currentTamilName: string): string | null {
  const cleanName = englishName.trim();
  
  // If current Tamil name has mixed script, we need to fix it
  if (currentTamilName && hasEnglishInTamil(currentTamilName)) {
    console.log(`Mixed script detected: ${englishName} → ${currentTamilName}`);
    
    // Try direct mapping first
    if (properTamilTranslations[cleanName]) {
      return properTamilTranslations[cleanName];
    }
    
    // Clean the existing Tamil text
    const cleanedTamil = cleanTamilText(currentTamilName);
    if (cleanedTamil.length > 1) {
      return cleanedTamil;
    }
  }
  
  // Check for direct mapping
  if (properTamilTranslations[cleanName]) {
    return properTamilTranslations[cleanName];
  }
  
  // Remove numeric prefixes for pattern matching
  const nameWithoutNumbers = cleanName.replace(/^\d+\s+/, '');
  if (properTamilTranslations[nameWithoutNumbers]) {
    return properTamilTranslations[nameWithoutNumbers];
  }
  
  return null;
}

async function fixMixedScriptTamil() {
  try {
    console.log('Starting mixed script Tamil fixes...');
    
    // Get all areas with problematic Tamil names
    const allAreas = await db.select().from(areas);
    console.log(`Processing ${allAreas.length} areas for mixed script issues...`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const area of allAreas) {
      try {
        const needsFixing = !area.tamilName || 
                          hasEnglishInTamil(area.tamilName) ||
                          area.tamilName.length < 2;
        
        if (needsFixing) {
          const properTamilName = getProperTamilName(area.name, area.tamilName || '');
          
          if (properTamilName && properTamilName !== area.tamilName) {
            await db.update(areas)
              .set({ tamilName: properTamilName })
              .where(eq(areas.id, area.id));
            
            updatedCount++;
            console.log(`${area.name}: ${area.tamilName} → ${properTamilName}`);
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
    
    console.log('\n=== Mixed Script Tamil Fix Summary ===');
    console.log(`Total areas processed: ${processedCount}`);
    console.log(`Areas updated with clean Tamil names: ${updatedCount}`);
    console.log(`Areas skipped: ${skippedCount}`);
    
    console.log('Mixed script Tamil fixes completed!');
    
  } catch (error) {
    console.error('Error during mixed script Tamil fixes:', error);
  }
}

// Run the script
fixMixedScriptTamil();