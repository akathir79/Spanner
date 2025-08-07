import fs from 'fs/promises';
import path from 'path';

const STATES_DISTRICTS_PATH = path.join(process.cwd(), 'shared', 'states-districts.json');

interface District {
  name: string;
}

interface State {
  state: string;
  districts: string[];
  serviceTypes?: string[];
}

interface StatesDistrictsData {
  states: State[];
}

// Default service types to initialize when states don't have any
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
  "Interior Design"
];

export class StatesDistrictsManager {
  private static instance: StatesDistrictsManager;
  private data: StatesDistrictsData | null = null;

  static getInstance(): StatesDistrictsManager {
    if (!StatesDistrictsManager.instance) {
      StatesDistrictsManager.instance = new StatesDistrictsManager();
    }
    return StatesDistrictsManager.instance;
  }

  async loadData(): Promise<StatesDistrictsData> {
    if (this.data) {
      return this.data;
    }

    try {
      const fileContent = await fs.readFile(STATES_DISTRICTS_PATH, 'utf-8');
      this.data = JSON.parse(fileContent);
      
      // Initialize serviceTypes for states that don't have them
      let updated = false;
      if (this.data) {
        for (const state of this.data.states) {
          if (!state.serviceTypes) {
            state.serviceTypes = [...DEFAULT_SERVICE_TYPES];
            updated = true;
          }
        }
        
        if (updated) {
          await this.saveData();
        }
      }
      
      return this.data!;
    } catch (error) {
      console.error('Error loading states-districts.json:', error);
      throw error;
    }
  }

  async saveData(): Promise<void> {
    if (!this.data) {
      throw new Error('No data to save');
    }

    try {
      const formattedData = JSON.stringify(this.data, null, 2);
      await fs.writeFile(STATES_DISTRICTS_PATH, formattedData, 'utf-8');
      console.log('Successfully updated states-districts.json');
    } catch (error) {
      console.error('Error saving states-districts.json:', error);
      throw error;
    }
  }

  async addServiceTypeToAllStates(serviceType: string): Promise<void> {
    await this.loadData();
    
    if (!this.data) {
      throw new Error('Failed to load states data');
    }

    let updated = false;
    
    for (const state of this.data.states) {
      if (!state.serviceTypes) {
        state.serviceTypes = [...DEFAULT_SERVICE_TYPES];
      }
      
      // Check if service type already exists (case-insensitive)
      const exists = state.serviceTypes.some(
        existing => existing.toLowerCase() === serviceType.toLowerCase()
      );
      
      if (!exists) {
        state.serviceTypes.push(serviceType);
        updated = true;
      }
    }

    if (updated) {
      await this.saveData();
      console.log(`Added service type "${serviceType}" to all states`);
    } else {
      console.log(`Service type "${serviceType}" already exists in all states`);
    }
  }

  async addServiceTypeToState(stateName: string, serviceType: string): Promise<void> {
    await this.loadData();
    
    if (!this.data) {
      throw new Error('Failed to load states data');
    }

    const state = this.data.states.find(s => s.state === stateName);
    if (!state) {
      throw new Error(`State "${stateName}" not found`);
    }

    if (!state.serviceTypes) {
      state.serviceTypes = [...DEFAULT_SERVICE_TYPES];
    }

    // Check if service type already exists (case-insensitive)
    const exists = state.serviceTypes.some(
      existing => existing.toLowerCase() === serviceType.toLowerCase()
    );

    if (!exists) {
      state.serviceTypes.push(serviceType);
      await this.saveData();
      console.log(`Added service type "${serviceType}" to state "${stateName}"`);
    } else {
      console.log(`Service type "${serviceType}" already exists in state "${stateName}"`);
    }
  }

  async getServiceTypesForState(stateName: string): Promise<string[]> {
    await this.loadData();
    
    if (!this.data) {
      return DEFAULT_SERVICE_TYPES;
    }

    const state = this.data.states.find(s => s.state === stateName);
    return state?.serviceTypes || DEFAULT_SERVICE_TYPES;
  }

  async getAllServiceTypes(): Promise<string[]> {
    await this.loadData();
    
    if (!this.data) {
      return DEFAULT_SERVICE_TYPES;
    }

    // Get unique service types across all states
    const allServiceTypes = new Set<string>();
    
    for (const state of this.data.states) {
      if (state.serviceTypes) {
        state.serviceTypes.forEach(serviceType => {
          allServiceTypes.add(serviceType);
        });
      }
    }

    return Array.from(allServiceTypes).sort();
  }
}

export const statesDistrictsManager = StatesDistrictsManager.getInstance();