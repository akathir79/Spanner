import { db } from './server/db';
import { districts, areas } from './shared/schema';
import { eq } from 'drizzle-orm';

// All Tamil Nadu districts with comprehensive data
const allDistricts = [
  { name: "Chennai", tamilName: "சென்னை", code: "CHN" },
  { name: "Coimbatore", tamilName: "கோயம்புத்தூர்", code: "CBE" },
  { name: "Madurai", tamilName: "மதுரை", code: "MDU" },
  { name: "Tiruchirappalli", tamilName: "திருச்சிராப்பள்ளி", code: "TRY" },
  { name: "Salem", tamilName: "சேலம்", code: "SLM" },
  { name: "Tirunelveli", tamilName: "திருநெல்வேலி", code: "TVL" },
  { name: "Tiruppur", tamilName: "திருப்பூர்", code: "TPR" },
  { name: "Vellore", tamilName: "வேலூர்", code: "VLR" },
  { name: "Erode", tamilName: "ஈரோடு", code: "ERD" },
  { name: "Thoothukkudi", tamilName: "தூத்துக்குடி", code: "TKD" },
  { name: "Kanchipuram", tamilName: "காஞ்சிபுரம்", code: "KCP" },
  { name: "Thanjavur", tamilName: "தஞ்சாவூர்", code: "TNJ" },
  { name: "Cuddalore", tamilName: "கடலூர்", code: "CDL" },
  { name: "Dindigul", tamilName: "திண்டுக்கல்", code: "DGL" },
  { name: "Karur", tamilName: "கரூர்", code: "KRR" },
  { name: "Nagapattinam", tamilName: "நாகப்பட்டினம்", code: "NPT" },
  { name: "Viluppuram", tamilName: "விழுப்புரம்", code: "VLP" },
  { name: "Tiruvannamalai", tamilName: "திருவண்ணாமலை", code: "TVA" },
  { name: "Sivaganga", tamilName: "சிவகங்கை", code: "SVG" },
  { name: "Ramanathapuram", tamilName: "இராமநாதபுரம்", code: "RMD" },
  { name: "Theni", tamilName: "தேனி", code: "TNI" },
  { name: "Virudhunagar", tamilName: "விருதுநகர்", code: "VDN" },
  { name: "Kanyakumari", tamilName: "கன்னியாகுமரி", code: "KNK" },
  { name: "Dharmapuri", tamilName: "தர்மபுரி", code: "DPR" },
  { name: "Krishnagiri", tamilName: "கிருஷ்ணகிரி", code: "KGI" },
  { name: "Namakkal", tamilName: "நாமக்கல்", code: "NMK" },
  { name: "Pudukottai", tamilName: "புதுக்கோட்டை", code: "PDK" },
  { name: "Ariyalur", tamilName: "அரியலூர்", code: "ARL" },
  { name: "Perambalur", tamilName: "பெரம்பலூர்", code: "PBL" },
  { name: "The Nilgiris", tamilName: "நீலகிரி", code: "NLG" },
  { name: "Thiruvallur", tamilName: "திருவள்ளூர்", code: "TVR" },
  { name: "Kancheepuram", tamilName: "காஞ்சீபுரம்", code: "KCH" },
  { name: "Ranipet", tamilName: "ராணிப்பேட்", code: "RNP" },
  { name: "Tirupattur", tamilName: "திருப்பத்தூர்", code: "TPT" },
  { name: "Chengalpattu", tamilName: "செங்கல்பட்டு", code: "CGP" },
  { name: "Tenkasi", tamilName: "தென்காசி", code: "TKS" },
  { name: "Tiruvarur", tamilName: "திருவாரூர்", code: "TVU" },
  { name: "Mayiladuthurai", tamilName: "மயிலாடுதுறை", code: "MLD" }
];

// Sample areas for major districts based on PDF data
const kanchipuramAreas = [
  "Angambakkam", "Ariyaperumpakkam", "Arpaakkam", "Asoor", "Avalur", "Ayyangarkulam", "Damal", 
  "Elayanarvelur", "Kalakattoor", "Kalur", "Kambarajapuram", "Karuppadithattadai", "Kavanthandalam", 
  "Keelambi", "Kilar", "Keelkadirpur", "Keelperamanallur", "Kolivakkam", "Konerikuppam", "Kooram", 
  "Magaral", "Melkadirpur", "Melottivakkam", "Musaravakkam", "Muthavedu", "Muttavakkam", "Narapakkam", 
  "Ozhakolpattu", "Perumbakkam", "Punjarasanthangal", "Putheri", "Sirukaveripakkam", "Sirunaiperugal", 
  "Thammanur", "Thimmasamudram", "Thiruparuthikundram", "Thiruppukuzhi", "Valathottam", "Vippedu", "Vishar",
  "Agaram", "Alapakkam", "Ariyambakkam", "Athivakkam", "Attuputhur", "Aymicheri", "Ayyampettai", 
  "Devariyambakkam", "Ekanampettai", "Enadur", "Govindavadi", "Illuppapattu", "Injambakkam", "Kaliyanoor", 
  "Karai", "Karur", "Kattavakkam", "Keelottivakkam", "Kithiripettai", "Kottavakkam", "Kunnavakkam", 
  "Kuthirambakkam", "Marutham", "Muthyalpettai", "Nathanallur", "Nayakkenpettai", "Nayakkenkuppam", 
  "Olaiyur", "Paduneli", "Palaiyaseevaram", "Paranthur", "Melpodavur", "Poosivakkam", "Pullalur", 
  "Puliyambakkam", "Purisai", "Puthagaram", "Puthupakkam", "Singadivakkam", "Sinnivakkam", "Siruvakkam", 
  "Siruvallur", "Thandalam", "Thangi", "Thenneri", "Thimmarajampettai", "Thimmaiyanpettai", 
  "Thiruvangaranai", "Thodur", "Thollazhi", "Ullavoor", "Uthukkadu", "Uveri", "Vaiyavur", "Valathur", 
  "Varanavasi", "Vedal", "Veliyur", "Venbakkam", "Villivalam"
];

const salemAreas = [
  "Aathur", "Ammapet", "Anaikatty", "Attur", "Ayothiyapattinam", "Belur", "Cherry Road", "Edappadi", 
  "Five Roads", "Gangavalli", "Hasthampatty", "Idappadi", "Kadayampatti", "Kondalampatty", "Mallur", 
  "Mettur", "Nagarmalai", "New Fairlands", "Omalur", "Panamarathupatti", "Pethanayakanpalayam", 
  "Salem", "Sankagiri", "Shevapet", "Tharamangalam", "Vazhapadi", "Yercaud"
];

const chennaiAreas = [
  "Adyar", "Alandur", "Ambattur", "Anna Nagar", "Besant Nagar", "Chrompet", "Egmore", "Guindy", 
  "Kodambakkam", "Madipakkam", "Mylapore", "Nandanam", "Nungambakkam", "Pallavaram", "Perungudi", 
  "Porur", "Sholinganallur", "T. Nagar", "Tambaram", "Thiruvanmiyur", "Velachery", "West Mambalam"
];

const coimbatoreAreas = [
  "Coimbatore North", "Coimbatore South", "Ganapathy", "Karamadai", "Kinathukadavu", "Madukkarai", 
  "Mettupalayam", "Peelamedu", "Perur", "Pollachi", "R.S. Puram", "Saravanampatti", "Singanallur", 
  "Sulur", "Thondamuthur", "Udumalaipettai", "Valparai"
];

async function seedComprehensiveData() {
  try {
    console.log('Starting comprehensive district and area seeding...');
    
    // First, ensure all districts exist
    console.log('Inserting districts...');
    const insertedDistricts = await db.insert(districts).values(allDistricts).onConflictDoNothing().returning();
    
    // Get all districts from DB to map names to IDs
    const allDistrictsFromDB = await db.select().from(districts);
    const districtMap = new Map();
    allDistrictsFromDB.forEach(district => {
      districtMap.set(district.code, district.id);
    });

    console.log(`Found ${allDistrictsFromDB.length} districts in database`);

    // Prepare area data
    const areasToInsert = [];

    // Add Kanchipuram areas
    const kanchipuramId = districtMap.get('KCP') || districtMap.get('KCH');
    if (kanchipuramId) {
      kanchipuramAreas.forEach(areaName => {
        areasToInsert.push({
          name: areaName,
          tamilName: null, // We'll add Tamil names later if needed
          districtId: kanchipuramId,
          isActive: true
        });
      });
    }

    // Add Salem areas
    const salemId = districtMap.get('SLM');
    if (salemId) {
      salemAreas.forEach(areaName => {
        areasToInsert.push({
          name: areaName,
          tamilName: null,
          districtId: salemId,
          isActive: true
        });
      });
    }

    // Add Chennai areas
    const chennaiId = districtMap.get('CHN');
    if (chennaiId) {
      chennaiAreas.forEach(areaName => {
        areasToInsert.push({
          name: areaName,
          tamilName: null,
          districtId: chennaiId,
          isActive: true
        });
      });
    }

    // Add Coimbatore areas
    const coimbatoreId = districtMap.get('CBE');
    if (coimbatoreId) {
      coimbatoreAreas.forEach(areaName => {
        areasToInsert.push({
          name: areaName,
          tamilName: null,
          districtId: coimbatoreId,
          isActive: true
        });
      });
    }

    // Add basic areas for other major districts
    const otherDistrictAreas = [
      { code: 'MDU', areas: ['Madurai East', 'Madurai West', 'Madurai North', 'Madurai South', 'Thiruparankundram', 'Usilampatti'] },
      { code: 'TRY', areas: ['Trichy Fort', 'Srirangam', 'Thillai Nagar', 'K.K. Nagar', 'Cantonment', 'Golden Rock'] },
      { code: 'ERD', areas: ['Erode East', 'Erode West', 'Bhavani', 'Gobichettipalayam', 'Sathyamangalam', 'Perundurai'] },
      { code: 'TVL', areas: ['Tirunelveli Town', 'Palayamkottai', 'Sankarankovil', 'Tenkasi', 'Ambasamudram', 'Nanguneri'] },
      { code: 'VLR', areas: ['Vellore Fort', 'Katpadi', 'Arakkonam', 'Arcot', 'Gudiyatham', 'Vaniyambadi'] }
    ];

    otherDistrictAreas.forEach(({ code, areas: districtAreas }) => {
      const districtId = districtMap.get(code);
      if (districtId) {
        districtAreas.forEach(areaName => {
          areasToInsert.push({
            name: areaName,
            tamilName: null,
            districtId: districtId,
            isActive: true
          });
        });
      }
    });

    console.log(`Inserting ${areasToInsert.length} areas...`);
    
    if (areasToInsert.length > 0) {
      // Insert areas in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < areasToInsert.length; i += batchSize) {
        const batch = areasToInsert.slice(i, i + batchSize);
        await db.insert(areas).values(batch).onConflictDoNothing();
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(areasToInsert.length/batchSize)}`);
      }
    }

    console.log('Comprehensive seeding completed successfully!');
    console.log(`Total districts: ${allDistricts.length}`);
    console.log(`Total areas inserted: ${areasToInsert.length}`);
    
  } catch (error) {
    console.error('Seeding error:', error);
  }
}

seedComprehensiveData();