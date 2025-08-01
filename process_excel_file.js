const XLSX = require('xlsx');
const fs = require('fs');

// Function to convert Excel file to JSON and display structure
function analyzeExcelFile() {
  try {
    const excelFilePath = './attached_assets/List of Rural Assembly Constituency in Village Panchayats_1754036266681.xlsx';
    
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error('Excel file not found at:', excelFilePath);
      return;
    }
    
    console.log('Reading Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('Sheet names:', workbook.SheetNames);
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n=== Sheet ${index + 1}: ${sheetName} ===`);
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Rows found: ${jsonData.length}`);
      
      if (jsonData.length > 0) {
        console.log('Column headers:', Object.keys(jsonData[0]));
        console.log('Sample rows:');
        
        // Show first 5 rows
        jsonData.slice(0, 5).forEach((row, idx) => {
          console.log(`Row ${idx + 1}:`, JSON.stringify(row, null, 2));
        });
      }
    });
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

// Run the analysis
analyzeExcelFile();