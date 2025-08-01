import { db } from './server/db';
import { areas } from './shared/schema';
import { eq } from 'drizzle-orm';

// Authentic Tamil translations for Tamil Nadu village/area names
const authenticTamilNames: Record<string, string> = {
  // From the image - fix these specific ones
  'Adhanakuruchi': 'அதனக்குறுச்சி',
  'Adichanur': 'ஆதிசனூர்',
  'Alagapuram': 'அலகாபுரம்',
  'Alagiyamanavalam': 'அழகியமனவாளம்',
  'Alanduraiyarkattalai': 'ஆலந்துறையார்கட்டலை',
  'Alathipallam': 'அலத்திப்பள்ளம்',
  'Alathiyur': 'அலத்தியூர்',
  'Amanaganthondi': 'அமனகந்தொண்டி',
  'Ambapur': 'அம்பாபூர்',
  
  // Common Tamil village/town names - authentic translations
  'Aalampalayam': 'ஆலம்பாளையம்',
  'Aanaikatti': 'ஆனைக்கட்டி',
  'Aarani': 'ஆரணி',
  'Aathur': 'ஆத்தூர்',
  'Aayakudi': 'ஆயக்குடி',
  'Abbirampuram': 'அபிராம்பुரம்',
  'Achampet': 'ஆச்சம்பேட்',
  'Adambakkam': 'ஆதம்பாக்கம்',
  'Adayar': 'அடையாறு',
  'Adhanur': 'ஆதனூர்',
  'Adhirampattinam': 'அதிராம்பட்டினம்',
  'Agaram': 'அகரம்',
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
  
  // B names
  'Bargur': 'பர்கூர்',
  'Belur': 'பேலூர்',
  'Bhavanisagar': 'பவானி சாகர்',
  'Bodinayakanur': 'போடிநாயக்கனூர்',
  'Budalur': 'புதலூர்',
  
  // C names
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
  
  // D names
  'Dharmapuri': 'தர்மபுரி',
  'Dindigul': 'திண்டுக்கல்',
  'Doraikuppam': 'தொரைக்குப்பம்',
  
  // E names
  'Edappadi': 'இடப்பாடி',
  'Erode': 'ஈரோடு',
  
  // G names
  'Gadilam': 'கடிலம்',
  'Gangavalli': 'கங்காவல்லி',
  'Gingee': 'செஞ்சி',
  'Gobichettipalayam': 'கோபிசெட்டிபாளையம்',
  'Gudiyatham': 'குடியாத்தம்',
  'Guduvanchery': 'குடுவாஞ்சேரி',
  'Gummidipoondi': 'கும்மிடிப்பூண்டி',
  
  // H names
  'Harur': 'அரூர்',
  'Hasthampatty': 'ஹஸ்தாம்பட்டி',
  'Hosur': 'ஓசூர்',
  
  // I, J names
  'Injambakkam': 'இஞ்சம்பாக்கம்',
  'Irungattukottai': 'இருங்கட்டுக்கோட்டை',
  'Jamunamarathur': 'யமுனாமரத்தூர்',
  'Jolarpet': 'ஜோலார்பேட்',
  
  // K names
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
  
  // L names
  'Lalgudi': 'லால்குடி',
  'Lathur': 'லத்தூர்',
  
  // M names
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
  
  // N names
  'Nagapattinam': 'நாகப்பட்டினம்',
  'Nagercoil': 'நாகர்கோயில்',
  'Namakkal': 'நாமக்கல்',
  'Nambiyur': 'நம்பியூர்',
  'Nandambakkam': 'நந்தம்பாக்கம்',
  'Nangavalli': 'நங்காவல்லி',
  'Natham': 'நாத்தம்',
  'Neyveli': 'நெய்வேலி',
  'Nilakottai': 'நீலக்கோட்டை',
  
  // O names
  'Oddanchatram': 'ஒட்டன்சத்திரம்',
  'Omalur': 'ஓமலூர்',
  'Orathanadu': 'ஒற்றநாடு',
  
  // P names
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
  
  // R names
  'Rajapalayam': 'ராஜபாளையம்',
  'Ramanathapuram': 'ராமநாதபுரம்',
  'Ranipet': 'ராணிப்பேட்',
  'Rasipuram': 'ராசிபுரம்',
  
  // S names
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
  
  // T names
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
  
  // U names
  'Udumalaipettai': 'உடுமலைப்பேட்டை',
  'Ulundurpet': 'உளுந்தூர்பேட்',
  'Uppiliapuram': 'உப்பிலியபுரம்',
  'Usilampatti': 'உசிலம்பட்டி',
  'Uthiramerur': 'உத்திரமேரூர்',
  
  // V names
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
  
  // W, Y names
  'Walajabad': 'வலாஜாபாத்',
  'Yelahanka': 'யேலஹங்கா',
  'Yercaud': 'யேர்காடு',
  
  // Common suffixes for pattern matching
  'palayam': 'பாளையம்',
  'patti': 'பட்டி',
  'puram': 'புரம்',
  'nagar': 'நகர்',
  'kottai': 'கோட்டை',
  'koil': 'கோயில்',
  'mangalam': 'மங்கலம்',
  'nallur': 'நல்லூர்',
  'thur': 'தூர்',
  'oor': 'ஊர்',
  'kudi': 'குடி',
  'vadi': 'வாடி',
  'padi': 'பாடி',
  'pet': 'பேட்',
  'bad': 'பாத்',
  'abad': 'ஆபாத்'
};

// Function to get authentic Tamil name
function getAuthenticTamilName(englishName: string): string | null {
  const cleanName = englishName.trim();
  
  // Direct mapping check
  if (authenticTamilNames[cleanName]) {
    return authenticTamilNames[cleanName];
  }
  
  // Remove numeric prefixes and try again
  const nameWithoutNumbers = cleanName.replace(/^\d+\s*\.?\s*/, '');
  if (authenticTamilNames[nameWithoutNumbers]) {
    return authenticTamilNames[nameWithoutNumbers];
  }
  
  // Pattern-based matching for compound names
  const patterns = [
    { pattern: /(.+)palayam$/i, suffix: 'பாளையம்' },
    { pattern: /(.+)patti$/i, suffix: 'பட்டி' },
    { pattern: /(.+)puram$/i, suffix: 'புரம்' },
    { pattern: /(.+)nagar$/i, suffix: 'நகர்' },
    { pattern: /(.+)kottai$/i, suffix: 'கோட்டை' },
    { pattern: /(.+)koil$/i, suffix: 'கோயில்' },
    { pattern: /(.+)mangalam$/i, suffix: 'மங்கலம்' },
    { pattern: /(.+)nallur$/i, suffix: 'நல்லூர்' },
    { pattern: /(.+)thur$/i, suffix: 'தூர்' },
    { pattern: /(.+)oor$/i, suffix: 'ஊர்' },
    { pattern: /(.+)kudi$/i, suffix: 'குடி' },
    { pattern: /(.+)vadi$/i, suffix: 'வாடி' },
    { pattern: /(.+)padi$/i, suffix: 'பாடி' },
    { pattern: /(.+)pet$/i, suffix: 'பேட்' }
  ];
  
  for (const { pattern, suffix } of patterns) {
    const match = cleanName.match(pattern);
    if (match) {
      const base = match[1];
      if (authenticTamilNames[base]) {
        return authenticTamilNames[base] + suffix;
      }
    }
  }
  
  return null;
}

async function fixAuthenticTamilTranslations() {
  try {
    console.log('Starting authentic Tamil translation fixes...');
    
    // Get all areas that need proper Tamil names
    const allAreas = await db.select().from(areas);
    console.log(`Processing ${allAreas.length} areas for authentic Tamil translations...`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const area of allAreas) {
      try {
        // Check if we need to update the Tamil name
        const authenticTamilName = getAuthenticTamilName(area.name);
        
        if (authenticTamilName && authenticTamilName !== area.tamilName) {
          await db.update(areas)
            .set({ tamilName: authenticTamilName })
            .where(eq(areas.id, area.id));
          
          updatedCount++;
          console.log(`${area.name}: ${area.tamilName} → ${authenticTamilName}`);
        } else {
          skippedCount++;
        }
        
        processedCount++;
        
        // Log progress every 1000 areas
        if (processedCount % 1000 === 0) {
          console.log(`Progress: ${processedCount}/${allAreas.length} processed...`);
        }
        
      } catch (error) {
        console.error(`Error processing ${area.name}:`, error);
        skippedCount++;
        processedCount++;
      }
    }
    
    console.log('\n=== Authentic Tamil Translation Fix Summary ===');
    console.log(`Total areas processed: ${processedCount}`);
    console.log(`Areas updated with authentic Tamil names: ${updatedCount}`);
    console.log(`Areas skipped: ${skippedCount}`);
    
    console.log('Authentic Tamil translation fixes completed!');
    
  } catch (error) {
    console.error('Error during authentic Tamil translation fixes:', error);
  }
}

// Run the script
fixAuthenticTamilTranslations();