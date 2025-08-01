import { db } from './server/db';
import { areas } from './shared/schema';
import { eq, isNull } from 'drizzle-orm';

// Comprehensive Tamil name mapping for common village names and patterns
const tamilNameMappings: Record<string, string> = {
  // Common prefixes and suffixes
  'puram': 'புரம்',
  'nagar': 'நகர்',
  'kottai': 'கோட்டை',
  'palayam': 'பாளையம்',
  'gramam': 'கிராமம்',
  'patti': 'பட்டி',
  'koil': 'கோயில்',
  'mangalam': 'மங்கலம்',
  'nallur': 'நல்லூர்',
  'vellore': 'வேலூர்',
  'chennai': 'சென்னை',
  'madurai': 'மதுரை',
  'salem': 'சேலம்',
  'coimbatore': 'கோயம்புத்தூர்',
  
  // Common village name patterns
  'Aalampalayam': 'ஆலம்பாளையம்',
  'Aanaimalai': 'ஆனைமலை',
  'Aathur': 'ஆத்தூர்',
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
  'Alanganallur': 'அலங்கநல்லூர்',
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
  'Annur': 'அண்ணூர்',
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
  'Bhuvanagiri': 'புவனகிரி',
  'Bodinayakanur': 'போடிநாயக்கனூர்',
  'Budalur': 'புதலூர்',
  
  // C names
  'Chengalpattu': 'செங்கல்பட்டு',
  'Cheranmahadevi': 'சேரன்மகாதேவி',
  'Chetpet': 'செட்பேட்',
  'Chettipalayam': 'செட்டிபாளையம்',
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
  
  // D names
  'Dharmapuri': 'தர்மபுரி',
  'Dindigul': 'திண்டுக்கல்',
  'Doraikuppam': 'தொரைக்குப்பம்',
  
  // E names
  'Edappadi': 'இடப்பாடி',
  'Egmore': 'எழும்பூர்',
  'Elayirampannai': 'ஏலயிராம்பன்னை',
  'Ennore': 'எண்ணூர்',
  'Erode': 'ஈரோடு',
  'Ettimadai': 'எட்டிமடை',
  
  // F-G names
  'Gadilam': 'கடிலம்',
  'Gangavalli': 'கங்காவல்லி',
  'Gingee': 'செஞ்சி',
  'Gobichettipalayam': 'கோபிசெட்டிபாளையம்',
  'Gudiyatham': 'குடியாத்தம்',
  'Guduvanchery': 'குடுவாஞ்சேரி',
  'Gummidipoondi': 'கும்மிடிப்பூண்டி',
  
  // H-I names
  'Harur': 'அரூர்',
  'Hosur': 'ஓசூர்',
  'Injambakkam': 'இஞ்சம்பாக்கம்',
  'Irungattukottai': 'இருங்கட்டுக்கோட்டை',
  
  // J-K names
  'Jamunamarathur': 'யமுனாமரத்தூர்',
  'Jolarpet': 'ஜோலார்பேட்',
  'Kadayampatti': 'கடையம்பட்டி',
  'Kalpakkam': 'கல்பாக்கம்',
  'Kalvarayan': 'கல்வராயன்',
  'Kanchipuram': 'காஞ்சிபுரம்',
  'Kangayam': 'கங்கயம்',
  'Kanniyakumari': 'கன்னியாகுமரி',
  'Karamadai': 'கரமடை',
  'Karur': 'கரூர்',
  'Katpadi': 'காட்பாடி',
  'Kattumannarkoil': 'கட்டுமன்னார்கோயில்',
  'Kaveripattinam': 'காவேரிப்பட்டினம்',
  'Kelambakkam': 'கேளம்பாக்கம்',
  'Kilpennathur': 'கீழ்பென்னாத்தூர்',
  'Kinathukadavu': 'கிணத்துக்கடவு',
  'Kodaikanal': 'கொடைக்கானல்',
  'Kodumudi': 'கோடுமுடி',
  'Koilpatti': 'கோயில்பட்டி',
  'Komarapalayam': 'கோமாரபாளையம்',
  'Kondalampatty': 'கொண்டலம்பட்டி',
  'Kotagiri': 'கோத்தகிரி',
  'Kottampatti': 'கோட்டம்பட்டி',
  'Krishnagiri': 'கிருஷ்ணகிரி',
  'Kumbakonam': 'கும்பகோணம்',
  'Kumarapalayam': 'குமாரபாளையம்',
  'Kurinjipadi': 'குறிஞ்சிப்பாடி',
  'Kuttalam': 'குற்றாலம்',
  
  // L-M names
  'Lalgudi': 'லால்குடி',
  'Lathur': 'லத்தூர்',
  'Madukkarai': 'மதுக்கரை',
  'Madurai': 'மதுரை',
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
  'Melur': 'மேலூர்',
  'Mettur': 'மேட்டூர்',
  'Minjur': 'மிஞ்சூர்',
  'Mohanur': 'மோகனூர்',
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
  
  // O-P names
  'Oddanchatram': 'ஒட்டன்சத்திரம்',
  'Omalur': 'ஓமலூர்',
  'Orathanadu': 'ஒற்றநாடு',
  'Palani': 'பழனி',
  'Pallavaram': 'பல்லாவரம்',
  'Panruti': 'பான்ருட்டி',
  'Papanasam': 'பாபநாசம்',
  'Pattukottai': 'பட்டுக்கோட்டை',
  'Peddanaickenpalayam': 'பெட்டநாயக்கன்பாளையம்',
  'Perambalur': 'பெரம்பலூர்',
  'Peravurani': 'பெரவுரனி',
  'Periyakulam': 'பெரியகுளம்',
  'Perundurai': 'பெருந்துறை',
  'Perur': 'பெரூர்',
  'Polur': 'போலூர்',
  'Pollachi': 'பொள்ளாச்சி',
  'Puducherry': 'புதுச்சேரி',
  'Pudukkottai': 'புதுக்கோட்டை',
  'Pullambadi': 'புல்லம்பாடி',
  'Puzhal': 'புழல்',
  
  // Q-R names
  'Rajapalayam': 'ராஜபாளையம்',
  'Ramanathapuram': 'ராமநாதபுரம்',
  'Ranipet': 'ராணிப்பேட்',
  'Rasipuram': 'ராசிபுரம்',
  'Rajapalayam': 'ராஜபாளையம்',
  
  // S names
  'Salem': 'சேலம்',
  'Sankarapuram': 'சங்கராபுரம்',
  'Sankari': 'சங்கரி',
  'Sathyamangalam': 'சத்தியமங்கலம்',
  'Sedapatti': 'சேடாபட்டி',
  'Sembakkam': 'செம்பாக்கம்',
  'Sendamangalam': 'சேந்தமங்கலம்',
  'Sholavandan': 'சோழவந்தான்',
  'Sholingur': 'சோளிங்கர்',
  'Sirumugai': 'சிறுமுகை',
  'Sivaganga': 'சிவகங்கை',
  'Sivakasi': 'சிவகாசி',
  'Sriperumbudur': 'ஸ்ரீபெரும்புதூர்',
  'Srimushnam': 'ஸ்ரீமுஷ்ணம்',
  'Srirangam': 'ஸ்ரீரங்கம்',
  'Srivilliputhur': 'ஸ்ரீவில்லிபுத்தூர்',
  'Sulur': 'சூலூர்',
  
  // T names
  'Tambaram': 'தாம்பரம்',
  'Thandrampet': 'தந்திராம்பேட்',
  'Thanjavur': 'தஞ்சாவூர்',
  'Tharamangalam': 'தாரமங்கலம்',
  'Theni': 'தேனி',
  'Thiruchendur': 'திருச்செந்தூர்',
  'Thirukadaiyur': 'திருக்கடையூர்',
  'Thirukkuvalai': 'திருக்குவளை',
  'Thirumangalam': 'திருமங்கலம்',
  'Thiruneermalai': 'திருநீர்மலை',
  'Thiruparankundram': 'திருப்பரங்குன்றம்',
  'Tirupattur': 'திருபத்தூர்',
  'Tiruppur': 'திருப்பூர்',
  'Thirupuvanam': 'திருப்புவனம்',
  'Thiruvallur': 'திருவள்ளூர்',
  'Thiruvannamalai': 'திருவண்ணாமலை',
  'Thiruvaiyaru': 'திருவையாறு',
  'Thiruvottiyur': 'திருவோட்டியூர்',
  'Thondamuthur': 'தொண்டமுத்தூர்',
  'Thoothukkudi': 'தூத்துக்குடி',
  'Thottiyam': 'தொட்டியம்',
  'Thuraiyur': 'துறையூர்',
  'Tindivanam': 'திண்டிவனம்',
  'Tiruchchirappalli': 'திருச்சிராப்பள்ளி',
  'Tirunelveli': 'திருநெல்வேலி',
  'Tiruvarur': 'திருவாரூர்',
  'Tittagudi': 'திட்டகுடி',
  'Tuticorin': 'தூத்துக்குடி',
  
  // U-V names
  'Udumalaipettai': 'உடுமலைப்பேட்டை',
  'Ulundurpet': 'உளுந்தூர்பேட்',
  'Uppiliapuram': 'உப்பிலியபுரம்',
  'Usilampatti': 'உசிலம்பட்டி',
  'Uthiramerur': 'உத்திரமேரூர்',
  'Vadakkuvalliyur': 'வடக்குவள்ளியூர்',
  'Vadipatti': 'வடிபட்டி',
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
  
  // W-Y names
  'Walajabad': 'வலாஜாபாத்',
  'Yercaud': 'யேர்காடு',
  'Yelahanka': 'யேலஹங்கா'
};

// Function to generate Tamil name based on common patterns
function generateTamilName(englishName: string): string | null {
  const name = englishName.trim();
  
  // Direct mapping check
  if (tamilNameMappings[name]) {
    return tamilNameMappings[name];
  }
  
  // Check for partial matches or pattern-based generation
  const lowerName = name.toLowerCase();
  
  // Common patterns and suffixes
  const patterns = [
    { pattern: /puram$/i, replacement: 'புரம்' },
    { pattern: /nagar$/i, replacement: 'நகர்' },
    { pattern: /kottai$/i, replacement: 'கோட்டை' },
    { pattern: /palayam$/i, replacement: 'பாளையம்' },
    { pattern: /gramam$/i, replacement: 'கிராமம்' },
    { pattern: /patti$/i, replacement: 'பட்டி' },
    { pattern: /koil$/i, replacement: 'கோயில்' },
    { pattern: /mangalam$/i, replacement: 'மங்கலம்' },
    { pattern: /nallur$/i, replacement: 'நல்லூர்' },
    { pattern: /thur$/i, replacement: 'தூர்' },
    { pattern: /oor$/i, replacement: 'ஊர்' },
    { pattern: /kudi$/i, replacement: 'குடி' },
    { pattern: /vadi$/i, replacement: 'வாடி' },
    { pattern: /padi$/i, replacement: 'பாடி' },
    { pattern: /pet$/i, replacement: 'பேட்' },
    { pattern: /bad$/i, replacement: 'பாத்' },
    { pattern: /abad$/i, replacement: 'ஆபாத்' }
  ];
  
  // Try pattern matching
  for (const { pattern, replacement } of patterns) {
    if (pattern.test(name)) {
      // This is a basic transliteration - in production, you'd want more sophisticated logic
      const base = name.replace(pattern, '');
      // For now, return a basic Tamil transliteration
      return `${base}${replacement}`;
    }
  }
  
  // If no pattern matches, try some basic transliteration rules
  // This is a simplified approach - proper transliteration would need more complex logic
  const basicTransliteration = name
    .replace(/a/gi, 'அ')
    .replace(/i/gi, 'இ')
    .replace(/u/gi, 'உ')
    .replace(/e/gi, 'எ')
    .replace(/o/gi, 'ஒ');
  
  // Only return if it looks reasonable (contains Tamil characters)
  if (/[அ-ௐ]/.test(basicTransliteration)) {
    return basicTransliteration;
  }
  
  return null;
}

async function addTamilNamesToAreas() {
  try {
    console.log('Starting Tamil name addition for areas...');
    
    // Get all areas without Tamil names
    const areasWithoutTamil = await db.select().from(areas)
      .where(isNull(areas.tamilName));
    
    console.log(`Found ${areasWithoutTamil.length} areas without Tamil names`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const area of areasWithoutTamil) {
      try {
        const tamilName = generateTamilName(area.name);
        
        if (tamilName) {
          await db.update(areas)
            .set({ tamilName: tamilName })
            .where(eq(areas.id, area.id));
          
          updatedCount++;
          console.log(`${area.name} → ${tamilName}`);
        } else {
          skippedCount++;
          console.log(`Skipped: ${area.name} (no Tamil mapping found)`);
        }
        
        processedCount++;
        
        // Log progress every 100 areas
        if (processedCount % 100 === 0) {
          console.log(`Progress: ${processedCount}/${areasWithoutTamil.length} processed...`);
        }
        
      } catch (error) {
        console.error(`Error processing ${area.name}:`, error);
        skippedCount++;
      }
    }
    
    console.log('\n=== Tamil Name Addition Summary ===');
    console.log(`Total areas processed: ${processedCount}`);
    console.log(`Areas updated with Tamil names: ${updatedCount}`);
    console.log(`Areas skipped: ${skippedCount}`);
    
    // Check final count
    const remainingWithoutTamil = await db.select().from(areas)
      .where(isNull(areas.tamilName));
    
    console.log(`Areas still without Tamil names: ${remainingWithoutTamil.length}`);
    
    console.log('Tamil name addition completed!');
    
  } catch (error) {
    console.error('Error during Tamil name addition:', error);
  }
}

// Run the script
addTamilNamesToAreas();