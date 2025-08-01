import { db } from './server/db';
import { areas, districts } from './shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

interface VillagePanchayatData {
  'SI.No. ': number;
  'DISTRICT': string;
  'ASSEMBLY CONSTITUENY NAME': string;
  'VILLAGE PANCHAYAT': string;
}

async function importVillagePanchayats() {
  try {
    console.log('Starting village panchayat import from Excel data...');
    
    // Read the exported JSON file
    const jsonFilePath = './excel_data_Assembly_Constituency.json';
    
    if (!fs.existsSync(jsonFilePath)) {
      console.error('JSON file not found. Please run process_excel_file.cjs first.');
      return;
    }
    
    const rawData = fs.readFileSync(jsonFilePath, 'utf8');
    const villagePanchayatData: VillagePanchayatData[] = JSON.parse(rawData);
    
    console.log(`Found ${villagePanchayatData.length} village panchayat records`);
    
    // Get all existing districts
    const existingDistricts = await db.select().from(districts);
    console.log(`Found ${existingDistricts.length} existing districts`);
    
    // Create district name mapping for case-insensitive matching
    const districtMap = new Map();
    existingDistricts.forEach(district => {
      districtMap.set(district.name.toLowerCase(), district);
      // Also map common alternate names
      if (district.name === 'Kanchipuram') {
        districtMap.set('kancheepuram', district);
      }
      if (district.name === 'Tiruchirappalli') {
        districtMap.set('trichy', district);
        districtMap.set('tiruchirapalli', district);
      }
      if (district.name === 'Tirunelveli') {
        districtMap.set('thirunelveli', district);
      }
      if (district.name === 'Thoothukkudi') {
        districtMap.set('thoothukudi', district);
        districtMap.set('tuticorin', district);
      }
    });
    
    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;
    let unmatchedDistricts = new Set();
    
    // Group data by district for efficient processing
    const groupedByDistrict = new Map();
    villagePanchayatData.forEach(record => {
      const districtName = record.DISTRICT?.trim();
      if (!districtName) return;
      
      if (!groupedByDistrict.has(districtName)) {
        groupedByDistrict.set(districtName, []);
      }
      groupedByDistrict.get(districtName).push(record);
    });
    
    console.log(`\nFound data for ${groupedByDistrict.size} districts`);
    
    // Process each district
    for (const [districtName, records] of groupedByDistrict) {
      console.log(`\nProcessing ${records.length} records for ${districtName}...`);
      
      // Find matching district
      const district = districtMap.get(districtName.toLowerCase());
      
      if (!district) {
        console.log(`  District '${districtName}' not found in database`);
        unmatchedDistricts.add(districtName);
        skippedCount += records.length;
        processedCount += records.length;
        continue;
      }
      
      console.log(`  Matched with district: ${district.name}`);
      
      // Get unique village panchayats for this district
      const uniqueVillages = new Set();
      records.forEach(record => {
        const villageName = record['VILLAGE PANCHAYAT']?.trim();
        if (villageName) {
          uniqueVillages.add(villageName);
        }
      });
      
      console.log(`  Found ${uniqueVillages.size} unique village panchayats`);
      
      // Process each unique village
      for (const villageName of uniqueVillages) {
        try {
          // Check if area already exists
          const existingArea = await db.select().from(areas)
            .where(eq(areas.name, villageName))
            .limit(1);
          
          if (existingArea.length > 0) {
            skippedCount++;
            continue;
          }
          
          // Get assembly constituency for this village
          const villageRecord = records.find(r => r['VILLAGE PANCHAYAT']?.trim() === villageName);
          const assemblyConstituency = villageRecord?.['ASSEMBLY CONSTITUENY NAME']?.trim();
          
          // Insert new area
          await db.insert(areas).values({
            id: crypto.randomUUID(),
            name: villageName,
            tamilName: null, // Will be populated by translation script
            districtId: district.id,
            pincode: null,
            latitude: null,
            longitude: null,
            isActive: true,
            createdAt: new Date(),
            assemblyConstituency: assemblyConstituency
          });
          
          insertedCount++;
          
        } catch (error) {
          console.error(`    Error inserting ${villageName}:`, error);
          skippedCount++;
        }
        
        processedCount++;
        
        // Log progress every 500 records
        if (processedCount % 500 === 0) {
          console.log(`    Progress: ${processedCount}/${villagePanchayatData.length} processed...`);
        }
      }
      
      console.log(`  Completed ${district.name}: ${insertedCount} new areas added`);
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Total records processed: ${processedCount}`);
    console.log(`New village panchayats inserted: ${insertedCount}`);
    console.log(`Records skipped (duplicates/errors): ${skippedCount}`);
    
    if (unmatchedDistricts.size > 0) {
      console.log('\nUnmatched districts:');
      unmatchedDistricts.forEach(name => console.log(`  - ${name}`));
    }
    
    // Show final count
    const totalAreas = await db.select().from(areas);
    console.log(`\nTotal areas in database: ${totalAreas.length}`);
    
    // Show district-wise counts
    const districtCounts = await db.execute(`
      SELECT d.name as district, COUNT(a.id) as area_count 
      FROM districts d 
      LEFT JOIN areas a ON d.id = a.district_id 
      GROUP BY d.id, d.name 
      ORDER BY area_count DESC 
      LIMIT 15
    `);
    
    console.log('\nTop 15 districts by area count:');
    districtCounts.forEach(row => {
      console.log(`  ${row.district}: ${row.area_count} areas`);
    });
    
    console.log('\nVillage panchayat import completed successfully!');
    
  } catch (error) {
    console.error('Error during village panchayat import:', error);
  }
}

// Run the import
importVillagePanchayats();