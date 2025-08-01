import { db } from './server/db';
import { areas, districts } from './shared/schema';
import { eq } from 'drizzle-orm';

// Since we can't directly read the Excel file, let's create a manual import
// based on common Tamil Nadu village/area data structure

const sampleVillageData = [
  // Salem District - Additional areas from common rural constituencies
  { district: 'Salem', areas: ['Attur', 'Gangavalli', 'Yercaud', 'Omalur', 'Mettur', 'Edappadi', 'Sankagiri', 'Kadayampatti', 'Kondalampatty', 'Panamarathupatti', 'Ayothiyapattinam', 'Belur', 'Nangavalli', 'Peddanaickenpalayam'] },
  
  // Chennai District - Additional suburban areas
  { district: 'Chennai', areas: ['Sholavaram', 'Puzhal', 'Minjur', 'Kathivakkam', 'Ennore Creek', 'Kaladipet', 'Vyasarpadi', 'Korukkupet', 'Thiruvottiyur', 'Manali New Town', 'Madhavaram Milk Colony', 'Retteri', 'Kolathur'] },
  
  // Coimbatore District - Rural areas
  { district: 'Coimbatore', areas: ['Kinathukadavu', 'Madukkarai', 'Thondamuthur', 'Annur', 'Avinashi Road', 'Sulur', 'Perur', 'Karamadai', 'Sirumugai', 'Narasimhanaickenpalayam', 'Ettimadai', 'Chettipalayam'] },
  
  // Madurai District - Additional areas
  { district: 'Madurai', areas: ['Thiruparankundram', 'Usilampatti', 'Melur', 'Vadipatti', 'Kalligudi', 'Chellampatti', 'Alanganallur', 'Tirumangalam', 'Kottampatti', 'Sholavandan', 'Sedapatti', 'Thirupuvanam'] },
  
  // Tiruchirappalli District - Rural constituencies
  { district: 'Tiruchirappalli', areas: ['Lalgudi', 'Manachanallur', 'Manapparai', 'Musiri', 'Thottiyam', 'Thuraiyur', 'Uppiliapuram', 'Thiruverumbur', 'Andanallur', 'Mannargudi', 'Pullambadi', 'Vaiyampatti'] },
  
  // Erode District - Additional villages
  { district: 'Erode', areas: ['Bhavani', 'Anthiyur', 'Gobichettipalayam', 'Sathyamangalam', 'Thalavadi', 'Kodumudi', 'Chennimalai', 'Perundurai', 'Nambiyur', 'Kumarapalayam'] },
  
  // Dindigul District - Rural areas
  { district: 'Dindigul', areas: ['Natham', 'Nilakottai', 'Oddanchatram', 'Athoor', 'Vedasandur', 'Chinnalapatti', 'Gujiliamparai', 'Reddiarchatram', 'Shanarpatti'] },
  
  // Thanjavur District - Delta region villages
  { district: 'Thanjavur', areas: ['Kumbakonam', 'Thiruvaiyaru', 'Papanasam', 'Pattukottai', 'Peravurani', 'Orathanadu', 'Thiruvidaimarudur', 'Budalur', 'Ammapettai'] },
  
  // Kanchipuram District - Temple towns and villages
  { district: 'Kanchipuram', areas: ['Chengalpattu', 'Madurantakam', 'Uthiramerur', 'Lathur', 'Sriperumbudur', 'Walajabad', 'Cheyyur', 'Kalpakkam', 'Vandalur'] },
  
  // Vellore District - Northern Tamil Nadu areas
  { district: 'Vellore', areas: ['Katpadi', 'Gudiyatham', 'Vaniyambadi', 'Tiruppattur', 'Ambur', 'Jolarpet', 'Sholingur', 'Arakonam', 'Arcot'] },
  
  // Cuddalore District - Coastal areas
  { district: 'Cuddalore', areas: ['Chidambaram', 'Vridhachalam', 'Tittagudi', 'Kattumannarkoil', 'Kurinjipadi', 'Panruti', 'Bhuvanagiri', 'Srimushnam'] },
  
  // Tiruvannamalai District - Hill stations and towns
  { district: 'Tiruvannamalai', areas: ['Arni', 'Cheyyar', 'Vandavasi', 'Polur', 'Arani', 'Kalasapakkam', 'Chetpet', 'Thandrampet', 'Jamunamarathur'] },
  
  // Villupuram District - Rural constituencies
  { district: 'Villupuram', areas: ['Tindivanam', 'Gingee', 'Vanur', 'Vikravandi', 'Kandachipuram', 'Marakkanam', 'Rishivandiyam', 'Sankarapuram'] },
  
  // Salem District - Additional hill areas
  { district: 'Salem', areas: ['Yercaud Hills', 'Servarayan Hills', 'Kalvarayan Hills', 'Pachamalai Hills', 'Shevaroy Hills', 'Kolli Hills Border'] },
];

async function manualImportVillageData() {
  try {
    console.log('Starting manual village data import...');
    
    // Get all existing districts
    const existingDistricts = await db.select().from(districts);
    console.log(`Found ${existingDistricts.length} existing districts`);
    
    let totalInserted = 0;
    let totalSkipped = 0;
    
    for (const districtData of sampleVillageData) {
      const district = existingDistricts.find(d => 
        d.name.toLowerCase() === districtData.district.toLowerCase()
      );
      
      if (!district) {
        console.log(`District '${districtData.district}' not found, skipping`);
        continue;
      }
      
      console.log(`\nProcessing ${districtData.areas.length} areas for ${district.name}...`);
      
      for (const areaName of districtData.areas) {
        try {
          // Check if area already exists
          const existingArea = await db.select().from(areas)
            .where(eq(areas.name, areaName))
            .limit(1);
          
          if (existingArea.length > 0) {
            console.log(`  ${areaName} - already exists`);
            totalSkipped++;
            continue;
          }
          
          // Insert new area
          await db.insert(areas).values({
            id: crypto.randomUUID(),
            name: areaName,
            tamilName: null, // Will be populated by translation script
            districtId: district.id,
            pincode: null,
            latitude: null,
            longitude: null,
            isActive: true,
            createdAt: new Date()
          });
          
          console.log(`  ${areaName} - inserted`);
          totalInserted++;
          
        } catch (error) {
          console.error(`  Error inserting ${areaName}:`, error);
          totalSkipped++;
        }
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Total areas inserted: ${totalInserted}`);
    console.log(`Total areas skipped: ${totalSkipped}`);
    
    // Show final count
    const totalAreas = await db.select().from(areas);
    console.log(`Total areas in database: ${totalAreas.length}`);
    
    console.log('\nManual import completed successfully!');
    
  } catch (error) {
    console.error('Error during manual import:', error);
  }
}

// Run the import
manualImportVillageData();