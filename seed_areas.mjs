import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Define schema for this script
const districts = pgTable("districts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tamilName: text("tamil_name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const areas = pgTable("areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tamilName: text("tamil_name"),
  districtId: varchar("district_id").references(() => districts.id).notNull(),
  pincode: text("pincode"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { areas, districts } });

const areasData = [
  // Chennai areas
  { name: "T. Nagar", tamilName: "டி. நகர்", districtCode: "CHN", pincode: "600017" },
  { name: "Anna Nagar", tamilName: "அண்ணா நகர்", districtCode: "CHN", pincode: "600040" },
  { name: "Adyar", tamilName: "அடையாறு", districtCode: "CHN", pincode: "600020" },
  { name: "Velachery", tamilName: "வேளச்சேரி", districtCode: "CHN", pincode: "600042" },
  { name: "Tambaram", tamilName: "தாம்பரம்", districtCode: "CHN", pincode: "600045" },
  
  // Coimbatore areas
  { name: "R.S. Puram", tamilName: "ஆர்.எஸ். புரம்", districtCode: "COI", pincode: "641002" },
  { name: "Peelamedu", tamilName: "பீளமேடு", districtCode: "COI", pincode: "641004" },
  { name: "Saravanampatti", tamilName: "சரவணம்பட்டி", districtCode: "COI", pincode: "641035" },
  { name: "Singanallur", tamilName: "சிங்காநல்லூர்", districtCode: "COI", pincode: "641005" },
  { name: "Ganapathy", tamilName: "கணபதி", districtCode: "COI", pincode: "641006" },
  
  // Madurai areas
  { name: "Anna Nagar", tamilName: "அண்ணா நகர்", districtCode: "MDU", pincode: "625020" },
  { name: "K.K. Nagar", tamilName: "கே.கே. நகர்", districtCode: "MDU", pincode: "625018" },
  { name: "Vilangudi", tamilName: "விளாங்குடி", districtCode: "MDU", pincode: "625018" },
  { name: "Sellur", tamilName: "செல்லூர்", districtCode: "MDU", pincode: "625002" },
  { name: "Thiruparankundram", tamilName: "திருப்பரங்குன்றம்", districtCode: "MDU", pincode: "625005" },
  
  // Tiruchirappalli areas
  { name: "Cantonment", tamilName: "கண்டோன்மென்ட்", districtCode: "TRI", pincode: "620001" },
  { name: "Srirangam", tamilName: "ஸ்ரீரங்கம்", districtCode: "TRI", pincode: "620006" },
  { name: "K.K. Nagar", tamilName: "கே.கே. நகர்", districtCode: "TRI", pincode: "620021" },
  { name: "Thillai Nagar", tamilName: "தில்லை நகர்", districtCode: "TRI", pincode: "620018" },
  { name: "Golden Rock", tamilName: "கோல்டன் ராக்", districtCode: "TRI", pincode: "620002" },
  
  // Salem areas  
  { name: "Five Roads", tamilName: "ஐந்து சாலைகள்", districtCode: "SLM", pincode: "636001" },
  { name: "New Fairlands", tamilName: "நியூ ஃபேர்லாந்து", districtCode: "SLM", pincode: "636016" },
  { name: "Ammapet", tamilName: "அம்மாபேட்", districtCode: "SLM", pincode: "636003" },
  { name: "Shevapet", tamilName: "ஷேவாபேட்", districtCode: "SLM", pincode: "636002" },
  { name: "Cherry Road", tamilName: "செர்ரி ரோடு", districtCode: "SLM", pincode: "636007" },
];

async function seedAreas() {
  try {
    console.log('Starting area seeding...');
    
    // Get all districts for mapping
    const allDistricts = await db.select().from(districts);
    
    const areasToInsert = [];
    
    for (const areaData of areasData) {
      const district = allDistricts.find(d => d.code === areaData.districtCode);
      if (district) {
        areasToInsert.push({
          name: areaData.name,
          tamilName: areaData.tamilName,
          districtId: district.id,
          pincode: areaData.pincode,
          isActive: true
        });
      }
    }
    
    if (areasToInsert.length > 0) {
      await db.insert(areas).values(areasToInsert);
      console.log(`Seeded ${areasToInsert.length} areas successfully`);
    } else {
      console.log('No areas to seed');
    }
    
  } catch (error) {
    console.error('Error seeding areas:', error);
  } finally {
    await pool.end();
  }
}

seedAreas();