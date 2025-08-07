// Script to initialize service types in states-districts.json
import { statesDistrictsManager } from './statesDistrictsManager.js';

async function initializeServiceTypes() {
  try {
    console.log('Initializing service types in states-districts.json...');
    
    // Just load the data - this will automatically initialize service types for all states
    await statesDistrictsManager.loadData();
    
    console.log('Successfully initialized service types for all states!');
    
    // Test by getting all service types
    const allServiceTypes = await statesDistrictsManager.getAllServiceTypes();
    console.log('Available service types:', allServiceTypes);
    
  } catch (error) {
    console.error('Error initializing service types:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeServiceTypes();
}

export { initializeServiceTypes };