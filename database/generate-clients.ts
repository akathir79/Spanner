import { db } from "../server/db";
import { users } from "../shared/schema";
import statesDistrictsData from "../shared/states-districts.json";

interface StateData {
  state: string;
  districts: string[];
}

// Function to generate a unique user ID
function generateUserId(state: string, district: string, count: number, role: string = "C"): string {
  // Convert state and district to 3-letter codes
  const stateCode = state.substring(0, 3).toUpperCase();
  const districtCode = district.substring(0, 3).toUpperCase();
  const userNumber = count.toString().padStart(4, '0');
  return `${stateCode}-${districtCode}-${userNumber}-${role}`;
}

// Function to normalize state/district names for usernames
function normalizeForUsername(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}

// Function to generate bank details
function generateBankDetails(userNumber: number) {
  const banks = [
    { name: "State Bank of India", ifsc: "SBIN0001234", branch: "Main Branch", address: "123 Bank Street, City Center" },
    { name: "HDFC Bank", ifsc: "HDFC0001234", branch: "Commercial Branch", address: "456 Business District" },
    { name: "ICICI Bank", ifsc: "ICIC0001234", branch: "Corporate Branch", address: "789 Financial Center" },
    { name: "Axis Bank", ifsc: "UTIB0001234", branch: "Metro Branch", address: "321 Urban Plaza" },
    { name: "Punjab National Bank", ifsc: "PUNB0001234", branch: "Central Branch", address: "654 Market Square" },
  ];
  
  const bank = banks[userNumber % banks.length];
  const accountNumber = `${1000000000 + userNumber * 123}`;
  const micr = `${500001000 + userNumber}`;
  
  return {
    bankName: bank.name,
    bankIFSC: bank.ifsc,
    bankBranch: bank.branch,
    bankAddress: bank.address,
    bankAccountNumber: accountNumber,
    bankMICR: micr.toString(),
    bankAccountType: userNumber % 2 === 0 ? "savings" : "current",
  };
}

// Function to generate mobile number
function generateMobile(baseNumber: number): string {
  // Generate numbers starting from 9876543000
  const mobile = 9876543000 + baseNumber;
  return mobile.toString();
}

// Function to generate pincode
function generatePincode(stateIndex: number, districtIndex: number): string {
  // Generate realistic pincodes based on state and district
  const basePincode = 100000 + (stateIndex * 1000) + (districtIndex * 10);
  return basePincode.toString().substring(0, 6);
}

export async function generateClients() {
  console.log("🚀 Starting client generation...");
  
  const states = statesDistrictsData.states as StateData[];
  let totalGenerated = 0;
  let globalUserCounter = 1;

  for (let stateIndex = 0; stateIndex < states.length; stateIndex++) {
    const state = states[stateIndex];
    console.log(`📍 Processing ${state.state}...`);
    
    for (let districtIndex = 0; districtIndex < state.districts.length; districtIndex++) {
      const district = state.districts[districtIndex];
      console.log(`  📌 Creating clients for ${district}...`);
      
      // Generate 10 clients per district
      for (let clientIndex = 1; clientIndex <= 10; clientIndex++) {
        const normalizedState = normalizeForUsername(state.state);
        const normalizedDistrict = normalizeForUsername(district);
        const firstName = `${normalizedState}${normalizedDistrict}user${clientIndex}`;
        const lastName = "Client";
        const email = `${firstName}@gmail.com`;
        const mobile = generateMobile(globalUserCounter);
        const userId = generateUserId(state.state, district, clientIndex);
        const bankDetails = generateBankDetails(globalUserCounter);
        const pincode = generatePincode(stateIndex, districtIndex);
        const address = `${clientIndex}/123, ${district} Street, ${district}, ${state.state}`;
        
        // Create the user
        const userData = {
          id: userId,
          firstName: firstName,
          lastName: lastName,
          email: email,
          mobile: mobile,
          role: "client" as const,
          state: state.state,
          district: district,
          address: address,
          pincode: pincode,
          isVerified: Math.random() > 0.3, // 70% verified
          isActive: true,
          bankAccountHolderName: `${firstName} ${lastName}`,
          bankAccountNumber: bankDetails.bankAccountNumber,
          bankIFSC: bankDetails.bankIFSC,
          bankName: bankDetails.bankName,
          bankBranch: bankDetails.bankBranch,
          bankAddress: bankDetails.bankAddress,
          bankMICR: bankDetails.bankMICR,
          bankAccountType: bankDetails.bankAccountType,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
          updatedAt: new Date(),
          lastLoginAt: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null, // 60% have logged in
        };

        try {
          await db.insert(users).values(userData);
          totalGenerated++;
          globalUserCounter++;
          
          if (totalGenerated % 100 === 0) {
            console.log(`    ✅ Generated ${totalGenerated} clients so far...`);
          }
        } catch (error) {
          console.error(`    ❌ Error creating user ${userId}:`, error);
        }
      }
    }
    
    console.log(`✅ Completed ${state.state} - Generated clients for ${state.districts.length} districts`);
  }
  
  console.log(`🎉 Client generation completed! Total clients generated: ${totalGenerated}`);
  return totalGenerated;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateClients()
    .then((total) => {
      console.log(`✅ Successfully generated ${total} clients`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error generating clients:", error);
      process.exit(1);
    });
}