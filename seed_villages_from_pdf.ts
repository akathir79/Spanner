import { db } from './server/db';
import { districts, areas } from './shared/schema';

// Extended village data from the PDF for major districts
const villageData = {
  'KANCHEEPURAM': [
    // From Kancheepuram block
    'Angambakkam', 'Ariyaperumpakkam', 'Arpaakkam', 'Asoor', 'Avalur', 'Ayyangarkulam', 'Damal',
    'Elayanarvelur', 'Kalakattoor', 'Kalur', 'Kambarajapuram', 'Karuppadithattadai', 'Kavanthandalam',
    'Keelambi', 'Kilar', 'Keelkadirpur', 'Keelperamanallur', 'Kolivakkam', 'Konerikuppam', 'Kooram',
    'Magaral', 'Melkadirpur', 'Melottivakkam', 'Musaravakkam', 'Muthavedu', 'Muttavakkam', 'Narapakkam',
    'Ozhakolpattu', 'Perumbakkam', 'Punjarasanthangal', 'Putheri', 'Sirukaveripakkam', 'Sirunaiperugal',
    'Thammanur', 'Thimmasamudram', 'Thiruparuthikundram', 'Thiruppukuzhi', 'Valathottam', 'Vippedu', 'Vishar',
    
    // From Walajabad block
    'Agaram', 'Alapakkam', 'Ariyambakkam', 'Athivakkam', 'Attuputhur', 'Aymicheri', 'Ayyampettai',
    'Devariyambakkam', 'Ekanampettai', 'Enadur', 'Govindavadi', 'Illuppapattu', 'Injambakkam', 'Kaliyanoor',
    'Karai', 'Karur', 'Kattavakkam', 'Keelottivakkam', 'Kithiripettai', 'Kottavakkam', 'Kunnavakkam',
    'Kuthirambakkam', 'Marutham', 'Muthyalpettai', 'Nathanallur', 'Nayakkenpettai', 'Nayakkenkuppam',
    'Olaiyur', 'Paduneli', 'Palaiyaseevaram', 'Paranthur', 'Melpodavur', 'Poosivakkam', 'Pullalur',
    'Puliyambakkam', 'Purisai', 'Puthagaram', 'Puthupakkam', 'Singadivakkam', 'Sinnivakkam', 'Siruvakkam',
    'Siruvallur', 'Thandalam', 'Thangi', 'Thenneri', 'Thimmarajampettai', 'Thimmaiyanpettai',
    'Thiruvangaranai', 'Thodur', 'Thollazhi', 'Ullavoor', 'Uthukkadu', 'Uveri', 'Vaiyavur', 'Valathur',
    'Varanavasi', 'Vedal', 'Veliyur', 'Venbakkam', 'Villivalam',
    
    // From Uthiramerur block
    'Adavapakkam', 'Agaramduli', 'Alisoor', 'Ammaiyappanallur', 'Anambakkam', 'Annadhur', 'Arasanimangalam',
    'Arumbuliyur', 'Athiyurmelduli', 'Chinnalambadi', 'Sithanakkavur', 'Edamichi', 'Edayambudur', 'Elanagar',
    'Hanumanthandalam', 'Kadalmangalam', 'Kaliyaampoondi', 'Kaliyapettai', 'Kammalampoondi', 'Kavanurpuducheri',
    'Karanai', 'Kariamangalam', 'Kattankulam', 'Karuveppampoondi', 'Kattiyampandal', 'Kavampair',
    'Kavithandalam', 'Kilakkadi', 'Kunnavakkam', 'Kurumanjeri', 'Madur', 'Malayankulam', 'Manamathy',
    'Marudam', 'Maruthavambadi', 'Melpakkam', 'Menallur', 'Manampathykandigai', 'Nanjeepuram', 'Neyyadivakkam',
    'Oddanthangal', 'Ozhugarai', 'Orakattupettai', 'Ozhaiyur', 'Paleswaram', 'Pazhaveri', 'Pennalur',
    'Perunagar', 'Perungozhi', 'Pinayur', 'Porpandal', 'Pulivoy', 'Pulipakkam', 'Puliyur'
  ],
  
  'SALEM': [
    'Aathur', 'Ammapet', 'Anaikatty', 'Attur', 'Ayothiyapattinam', 'Belur', 'Cherry Road', 'Edappadi',
    'Five Roads', 'Gangavalli', 'Hasthampatty', 'Idappadi', 'Kadayampatti', 'Kondalampatty', 'Mallur',
    'Mettur', 'Nagarmalai', 'New Fairlands', 'Omalur', 'Panamarathupatti', 'Pethanayakanpalayam',
    'Salem City', 'Sankagiri', 'Shevapet', 'Tharamangalam', 'Vazhapadi', 'Yercaud', 'Nangavalli',
    'Peddanaickenpalayam', 'Mecheri', 'Thevur', 'Kolathur', 'Jalakandapuram', 'Magudanchavadi'
  ],
  
  'CHENNAI': [
    'Adyar', 'Alandur', 'Ambattur', 'Anna Nagar', 'Besant Nagar', 'Chrompet', 'Egmore', 'Guindy',
    'Kodambakkam', 'Madipakkam', 'Mylapore', 'Nandanam', 'Nungambakkam', 'Pallavaram', 'Perungudi',
    'Porur', 'Sholinganallur', 'T. Nagar', 'Tambaram', 'Thiruvanmiyur', 'Velachery', 'West Mambalam',
    'Royapettah', 'Teynampet', 'Alwarpet', 'Chetpet', 'Kilpauk', 'Purasaiwalkam', 'Washermanpet',
    'Tondiarpet', 'Royapuram', 'Madhavaram', 'Manali', 'Ennore', 'Tiruvottiyur', 'Avadi'
  ],
  
  'COIMBATORE': [
    'Coimbatore North', 'Coimbatore South', 'Ganapathy', 'Karamadai', 'Kinathukadavu', 'Madukkarai',
    'Mettupalayam', 'Peelamedu', 'Perur', 'Pollachi', 'R.S. Puram', 'Saravanampatti', 'Singanallur',
    'Sulur', 'Thondamuthur', 'Udumalaipettai', 'Valparai', 'Annur', 'Avinashi', 'Tiruppur',
    'Dharapuram', 'Kangeyam', 'Palladam', 'Anaimalai', 'Madukarai'
  ],
  
  'MADURAI': [
    'Madurai East', 'Madurai West', 'Madurai North', 'Madurai South', 'Thiruparankundram', 'Usilampatti',
    'Melur', 'Vadipatti', 'Kalligudi', 'Chellampatti', 'Alanganallur', 'Tirumangalam', 'T. Kallupatti',
    'Peraiyur', 'Kottampatti', 'Sholavandan', 'Sedapatti'
  ],
  
  'TIRUCHIRAPPALLI': [
    'Trichy Fort', 'Srirangam', 'Thillai Nagar', 'K.K. Nagar', 'Cantonment', 'Golden Rock',
    'Lalgudi', 'Manachanallur', 'Manapparai', 'Musiri', 'Thottiyam', 'Thuraiyur', 'Uppiliapuram',
    'Thiruverumbur', 'Andanallur'
  ]
};

async function seedVillagesFromPDF() {
  try {
    console.log('Starting village seeding from PDF data...');
    
    // Get all districts for mapping
    const allDistrictsFromDB = await db.select().from(districts);
    const districtMap = new Map();
    allDistrictsFromDB.forEach(district => {
      districtMap.set(district.name.toUpperCase(), district.id);
    });

    console.log(`Found ${allDistrictsFromDB.length} districts in database`);

    // Prepare areas data
    const areasToInsert = [];
    let totalVillages = 0;

    for (const [districtName, villages] of Object.entries(villageData)) {
      const districtId = districtMap.get(districtName);
      
      if (districtId) {
        console.log(`Processing ${villages.length} villages for ${districtName}`);
        
        villages.forEach(villageName => {
          areasToInsert.push({
            name: villageName,
            tamilName: null, // We can add Tamil translations later
            districtId: districtId,
            isActive: true
          });
        });
        
        totalVillages += villages.length;
      } else {
        console.log(`District ${districtName} not found in database`);
      }
    }

    console.log(`Preparing to insert ${areasToInsert.length} new villages...`);

    if (areasToInsert.length > 0) {
      // Insert in batches to avoid overwhelming the database
      const batchSize = 50;
      let insertedCount = 0;
      
      for (let i = 0; i < areasToInsert.length; i += batchSize) {
        const batch = areasToInsert.slice(i, i + batchSize);
        await db.insert(areas).values(batch).onConflictDoNothing();
        insertedCount += batch.length;
        console.log(`Inserted ${insertedCount}/${areasToInsert.length} villages`);
      }
    }

    console.log('Village seeding completed successfully!');
    console.log(`Total villages processed: ${totalVillages}`);
    
    // Get final count
    const finalCount = await db.select().from(areas);
    console.log(`Total areas in database: ${finalCount.length}`);
    
  } catch (error) {
    console.error('Village seeding error:', error);
  }
}

seedVillagesFromPDF();