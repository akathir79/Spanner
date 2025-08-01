import { db } from './server/db';
import { areas } from './shared/schema';
import { eq } from 'drizzle-orm';

// Proper Tamil translations for common area names
const properTamilTranslations = {
  // Salem areas
  'Aathur': 'ஆத்தூர்',
  'Ammapet': 'அம்மாபேட்',
  'Attur': 'ஆத்தூர்',
  'Ayothiyapattinam': 'அயோத்தியாபட்டினம்',
  'Belur': 'பேலூர்',
  'Cherry Road': 'செர்ரி ரோடு',
  'Edappadi': 'இடப்பாடி',
  'Five Roads': 'ஐந்து சாலைகள்',
  'Gangavalli': 'கங்காவள்ளி',
  'Hasthampatty': 'ஹஸ்தாம்பட்டி',
  'Idappadi': 'இடப்பாடி',
  'Kadayampatti': 'கடையம்பட்டி',
  'Kondalampatty': 'கொண்டலம்பட்டி',
  'Magudanchavadi': 'மகுதாஞ்சாவடி',
  'Mallur': 'மல்லூர்',
  'Mettur': 'மேட்டூர்',
  'Nagarmalai': 'நாகர்மலை',
  'New Fairlands': 'நியூ ஃபேர்லாந்து',
  'Omalur': 'ஓமலூர்',
  'Panamarathupatti': 'பனமரதுப்பட்டி',
  'Pethanayakanpalayam': 'பெத்தனாயக்கன்பாளையம்',
  'Salem': 'சேலம்',
  'Sankagiri': 'சங்ககிரி',
  'Shevapet': 'ஷேவாபேட்',
  'Tharamangalam': 'தாரமங்கலம்',
  'Vazhapadi': 'வாழப்பாடி',
  'Yercaud': 'ஏற்காடு',
  'Nangavalli': 'நங்காவள்ளி',
  'Peddanaickenpalayam': 'பெட்டனாயக்கன்பாளையம்',
  'Mecheri': 'மேச்சேரி',
  'Thevur': 'தேவூர்',
  'Kolathur': 'கோலத்தூர்',
  'Jalakandapuram': 'ஜலகண்டபுரம்',

  // Chennai areas
  'Adyar': 'அடையாறு',
  'Alandur': 'ஆலந்தூர்',
  'Ambattur': 'அம்பத்தூர்',
  'Anna Nagar': 'அண்ணா நகர்',
  'Besant Nagar': 'பெசன்ட் நகர்',
  'Chrompet': 'குரோம்பேட்',
  'Egmore': 'எழும்பூர்',
  'Guindy': 'கிண்டி',
  'Kodambakkam': 'கோடம்பாக்கம்',
  'Madipakkam': 'மதிப்பாக்கம்',
  'Mylapore': 'மயிலாப்பூர்',
  'Nandanam': 'நந்தனம்',
  'Nungambakkam': 'நுங்கம்பாக்கம்',
  'Pallavaram': 'பல்லாவரம்',
  'Perungudi': 'பெருங்குடி',
  'Porur': 'போரூர்',
  'Sholinganallur': 'சோளிங்கநல்லூர்',
  'T. Nagar': 'டி. நகர்',
  'Tambaram': 'தாம்பரம்',
  'Thiruvanmiyur': 'திருவான்மியூர்',
  'Velachery': 'வேளச்சேரி',
  'West Mambalam': 'மேற்கு மாம்பலம்',
  'Royapettah': 'ராயப்பேட்டை',
  'Teynampet': 'தெய்னாம்பேட்',
  'Alwarpet': 'அல்வார்பேட்',
  'Chetpet': 'செட்பேட்',
  'Kilpauk': 'கிள்பாக்',
  'Purasaiwalkam': 'புரசைவாக்கம்',
  'Washermanpet': 'வாஷர்மன்பேட்',
  'Tondiarpet': 'தொண்டியார்பேட்',
  'Royapuram': 'ராயப்புரம்',
  'Madhavaram': 'மாதவரம்',
  'Manali': 'மனாலி',
  'Ennore': 'எண்ணூர்',
  'Tiruvottiyur': 'திருவொற்றியூர்',
  'Avadi': 'ஆவடி',

  // Coimbatore areas
  'Coimbatore North': 'கோயம்புத்தூர் வடக்கு',
  'Coimbatore South': 'கோயம்புத்தூர் தெற்கு',
  'Ganapathy': 'கணபதி',
  'Karamadai': 'காரமடை',
  'Kinathukadavu': 'கிணத்துக்கடவு',
  'Madukkarai': 'மதுக்கரை',
  'Mettupalayam': 'மேட்டுப்பாளையம்',
  'Peelamedu': 'பீளமேடு',
  'Perur': 'பேரூர்',
  'Pollachi': 'பொள்ளாச்சி',
  'R.S. Puram': 'ஆர்.எஸ். புரம்',
  'Saravanampatti': 'சரவணம்பட்டி',
  'Singanallur': 'சிங்காநல்லூர்',
  'Sulur': 'சூலூர்',
  'Thondamuthur': 'தொண்டாமுத்தூர்',
  'Udumalaipettai': 'உடுமலைப்பேட்டை',
  'Valparai': 'வால்பாறை',
  'Annur': 'அன்னூர்',
  'Avinashi': 'அவிநாசி',
  'Tiruppur': 'திருப்பூர்',
  'Dharapuram': 'தாரापுரம்',
  'Kangeyam': 'காங்கேயம்',
  'Palladam': 'பல்லடம்',
  'Anaimalai': 'அணைமலை',
  'Madukarai': 'மதுக்கரை',

  // Madurai areas
  'Madurai East': 'மதுரை கிழக்கு',
  'Madurai West': 'மதுரை மேற்கு',
  'Madurai North': 'மதுரை வடக்கு',
  'Madurai South': 'மதுரை தெற்கு',
  'Thiruparankundram': 'திருப்பரங்குன்றம்',
  'Usilampatti': 'உசிலம்பட்டி',
  'Melur': 'மேலூர்',
  'Vadipatti': 'வாடிப்பட்டி',
  'Kalligudi': 'கல்லிகுடி',
  'Chellampatti': 'செல்லம்பட்டி',
  'Alanganallur': 'அலங்காநல்லூர்',
  'Tirumangalam': 'திருமங்கலம்',
  'T. Kallupatti': 'டி. கல்லுப்பட்டி',
  'Peraiyur': 'பேரையூர்',
  'Kottampatti': 'கோட்டம்பட்டி',
  'Sholavandan': 'சோழவந்தான்',
  'Sedapatti': 'சேடப்பட்டி',

  // Tiruchirappalli areas
  'Trichy Fort': 'திருச்சி கோட்டை',
  'Srirangam': 'ஸ்ரீரங்கம்',
  'Thillai Nagar': 'தில்லை நகர்',
  'K.K. Nagar': 'கே.கே. நகர்',
  'Cantonment': 'கான்டோன்மென்ட்',
  'Golden Rock': 'கோல்டன் ராக்',
  'Lalgudi': 'லால்குடி',
  'Manachanallur': 'மணச்சநல்லூர்',
  'Manapparai': 'மணப்பாறை',
  'Musiri': 'முசிறி',
  'Thottiyam': 'தொட்டியம்',
  'Thuraiyur': 'துறையூர்',
  'Uppiliapuram': 'உப்பிலியபுரம்',
  'Thiruverumbur': 'திருவெறும்பூர்',
  'Andanallur': 'அண்டநல்லூர்',

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
  'garam': 'கரம்'
};

async function fixTamilTranslations() {
  try {
    console.log('Starting Tamil translation fixes...');
    
    // Get all areas with problematic Tamil names (containing English characters)
    const allAreas = await db.select().from(areas);
    console.log(`Processing ${allAreas.length} areas...`);
    
    let updatedCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < allAreas.length; i += batchSize) {
      const batch = allAreas.slice(i, i + batchSize);
      
      for (const area of batch) {
        let needsUpdate = false;
        let newTamilName = null;
        
        // Check if current Tamil name has English characters (indicating it needs fixing)
        if (area.tamilName && /[a-zA-Z]/.test(area.tamilName)) {
          needsUpdate = true;
        }
        
        // Check if we have a proper translation
        if (properTamilTranslations[area.name]) {
          newTamilName = properTamilTranslations[area.name];
          needsUpdate = true;
        } else if (!area.tamilName || area.tamilName.trim() === '') {
          // For areas without Tamil names, try to create one
          const lowerName = area.name.toLowerCase();
          
          // Apply suffix-based translations
          if (lowerName.endsWith('puram')) {
            newTamilName = area.name.replace(/puram$/i, 'புரம்');
          } else if (lowerName.endsWith('nagar')) {
            newTamilName = area.name.replace(/nagar$/i, 'நகர்');
          } else if (lowerName.endsWith('pettai')) {
            newTamilName = area.name.replace(/pettai$/i, 'பேட்டை');
          } else if (lowerName.endsWith('palayam')) {
            newTamilName = area.name.replace(/palayam$/i, 'பாளையம்');
          } else if (lowerName.endsWith('kuppam')) {
            newTamilName = area.name.replace(/kuppam$/i, 'குப்பம்');
          } else if (lowerName.endsWith('vakkam')) {
            newTamilName = area.name.replace(/vakkam$/i, 'வாக்கம்');
          } else if (lowerName.endsWith('ur') || lowerName.endsWith('oor')) {
            newTamilName = area.name.replace(/(ur|oor)$/i, 'ஊர்');
          }
          
          if (newTamilName) {
            needsUpdate = true;
          }
        }
        
        // Update if needed
        if (needsUpdate && newTamilName) {
          await db.update(areas)
            .set({ tamilName: newTamilName })
            .where(eq(areas.id, area.id));
          updatedCount++;
          console.log(`Updated: ${area.name} -> ${newTamilName}`);
        }
      }
      
      console.log(`Processed ${Math.min((i + batchSize), allAreas.length)}/${allAreas.length} areas...`);
    }
    
    console.log(`Tamil translation fixes completed! Updated ${updatedCount} areas.`);
    
    // Show some examples of fixed translations
    const sampleFixed = await db.select().from(areas).limit(10);
    console.log('\nSample areas with proper Tamil names:');
    sampleFixed.forEach(area => {
      if (area.tamilName) {
        console.log(`${area.name} -> ${area.tamilName}`);
      }
    });
    
  } catch (error) {
    console.error('Error fixing Tamil translations:', error);
  }
}

fixTamilTranslations();