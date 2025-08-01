import * as XLSX from 'xlsx';
import { db } from './server/db';
import { areas, districts } from './shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface ExcelRowData {
  [key: string]: any;
}

// Function to convert Excel file to JSON
function convertExcelToJson(filePath: string): ExcelRowData[] {
  try {
    console.log(`Reading Excel file: ${filePath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Successfully converted Excel to JSON. Found ${jsonData.length} rows.`);
    return jsonData as ExcelRowData[];
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

// Function to process and import the data
async function importExcelData() {
  try {
    const excelFilePath = './attached_assets/List of Rural Assembly Constituency in Village Panchayats_1754036266681.xlsx';
    
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error('Excel file not found at:', excelFilePath);
      return;
    }
    
    // Convert Excel to JSON
    const excelData = convertExcelToJson(excelFilePath);
    
    if (!excelData || excelData.length === 0) {
      console.log('No data found in Excel file');
      return;
    }
    
    console.log('Sample row:', JSON.stringify(excelData[0], null, 2));
    
    // Get all existing districts for mapping
    const existingDistricts = await db.select().from(districts);
    console.log(`Found ${existingDistricts.length} existing districts`);
    
    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;
    
    // Process each row
    for (const row of excelData) {
      try {
        // Extract district and area information from the row
        // We'll need to identify the column names first
        const rowKeys = Object.keys(row);
        console.log(`Row ${processedCount + 1} keys:`, rowKeys);
        
        // Try to identify district and area columns based on common patterns
        let districtName = null;
        let areaName = null;
        let assemblyConstituency = null;
        let villagePanchayat = null;
        
        // Look for district in various possible column names
        for (const key of rowKeys) {
          const lowerKey = key.toLowerCase();
          const value = String(row[key] || '').trim();
          
          if (value && (lowerKey.includes('district') || lowerKey.includes('dt'))) {
            districtName = value;
          } else if (value && (lowerKey.includes('village') || lowerKey.includes('area') || lowerKey.includes('place'))) {
            areaName = value;
          } else if (value && lowerKey.includes('assembly')) {
            assemblyConstituency = value;
          } else if (value && lowerKey.includes('panchayat')) {
            villagePanchayat = value;
          }
        }
        
        // If we couldn't identify columns, use the first few values
        if (!districtName && !areaName) {
          const values = Object.values(row).map(v => String(v || '').trim()).filter(v => v);
          if (values.length >= 2) {
            districtName = values[0];
            areaName = values[1];
          }
        }
        
        if (!districtName || !areaName) {
          console.log(`Skipping row ${processedCount + 1}: Missing district or area data`);
          skippedCount++;
          processedCount++;
          continue;
        }
        
        // Find matching district
        const district = existingDistricts.find(d => 
          d.name.toLowerCase().includes(districtName.toLowerCase()) ||
          districtName.toLowerCase().includes(d.name.toLowerCase())
        );
        
        if (!district) {
          console.log(`Skipping ${areaName}: District '${districtName}' not found`);
          skippedCount++;
          processedCount++;
          continue;
        }
        
        // Check if area already exists
        const existingArea = await db.select().from(areas)
          .where(eq(areas.name, areaName))
          .limit(1);
        
        if (existingArea.length > 0) {
          console.log(`Area '${areaName}' already exists, skipping`);
          skippedCount++;
          processedCount++;
          continue;
        }
        
        // Insert new area
        await db.insert(areas).values({
          id: crypto.randomUUID(),
          name: areaName,
          tamilName: null, // We'll add Tamil names later if needed
          districtId: district.id,
          pincode: null,
          latitude: null,
          longitude: null,
          isActive: true,
          createdAt: new Date(),
          assemblyConstituency: assemblyConstituency,
          villagePanchayat: villagePanchayat
        });
        
        insertedCount++;
        console.log(`Inserted: ${areaName} in ${district.name}`);
        
      } catch (error) {
        console.error(`Error processing row ${processedCount + 1}:`, error);
        skippedCount++;
      }
      
      processedCount++;
      
      // Log progress every 100 rows
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${excelData.length} rows...`);
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Total rows processed: ${processedCount}`);
    console.log(`New areas inserted: ${insertedCount}`);
    console.log(`Rows skipped: ${skippedCount}`);
    console.log('Import completed successfully!');
    
    // Show final count
    const totalAreas = await db.select().from(areas);
    console.log(`Total areas in database: ${totalAreas.length}`);
    
  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Export function for manual execution
export { importExcelData };

// Run if called directly
if (require.main === module) {
  importExcelData();
}