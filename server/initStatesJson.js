import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATES_DISTRICTS_PATH = path.join(__dirname, '../shared/states-districts.json');

const DEFAULT_SERVICE_TYPES = [
  "Plumbing",
  "Electrical", 
  "Painting",
  "Carpentry",
  "AC Repair",
  "Appliance Repair",
  "Cleaning Services",
  "Pest Control",
  "Home Security",
  "Interior Design",
  "Gardening Services",
  "Pool Maintenance"
];

async function initializeServiceTypes() {
  try {
    console.log('Reading states-districts.json...');
    const fileContent = fs.readFileSync(STATES_DISTRICTS_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log(`Found ${data.states.length} states`);
    
    let updated = false;
    for (const state of data.states) {
      if (!state.serviceTypes) {
        state.serviceTypes = [...DEFAULT_SERVICE_TYPES];
        updated = true;
        console.log(`Added service types to ${state.state}`);
      }
    }
    
    if (updated) {
      const formattedData = JSON.stringify(data, null, 2);
      fs.writeFileSync(STATES_DISTRICTS_PATH, formattedData, 'utf-8');
      console.log('Successfully updated states-districts.json with service types!');
    } else {
      console.log('All states already have service types');
    }
    
    // Verify
    const statesWithServiceTypes = data.states.filter(s => s.serviceTypes).length;
    console.log(`States with service types: ${statesWithServiceTypes}/${data.states.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

initializeServiceTypes();