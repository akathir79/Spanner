import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq, and, isNull } from "drizzle-orm";

// Indian bank names for realistic data
const bankNames = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Punjab National Bank",
  "Bank of Baroda", "Canara Bank", "Union Bank of India", "Bank of India",
  "Indian Bank", "Central Bank of India", "IDBI Bank", "UCO Bank",
  "Indian Overseas Bank", "Punjab & Sind Bank", "Axis Bank", "Kotak Mahindra Bank",
  "IndusInd Bank", "Yes Bank", "Federal Bank", "South Indian Bank",
  "Karur Vysya Bank", "Tamilnad Mercantile Bank", "City Union Bank", "Dhanlaxmi Bank"
];

// Bank branches based on state/district
const getBankBranch = (district: string, state: string) => {
  const branches = [
    `${district} Main Branch`, `${district} City Branch`, `${district} Market Branch`,
    `${district} Commercial Branch`, `${district} Railway Road Branch`, `${district} Bus Stand Branch`,
    `New ${district} Branch`, `${district} Central Branch`, `${district} Extension Branch`
  ];
  return branches[Math.floor(Math.random() * branches.length)];
};

// Generate IFSC code (realistic format)
const generateIFSC = (bankName: string) => {
  // Real IFSC format: 4 letter bank code + 0 + 6 alphanumeric branch code
  const bankCodes: { [key: string]: string } = {
    "State Bank of India": "SBIN",
    "HDFC Bank": "HDFC",
    "ICICI Bank": "ICIC",
    "Punjab National Bank": "PUNB",
    "Bank of Baroda": "BARB",
    "Canara Bank": "CNRB",
    "Union Bank of India": "UBIN",
    "Bank of India": "BKID",
    "Indian Bank": "IDIB",
    "Central Bank of India": "CBIN",
    "IDBI Bank": "IBKL",
    "UCO Bank": "UCBA",
    "Indian Overseas Bank": "IOBA",
    "Punjab & Sind Bank": "PSIB",
    "Axis Bank": "UTIB",
    "Kotak Mahindra Bank": "KKBK",
    "IndusInd Bank": "INDB",
    "Yes Bank": "YESB",
    "Federal Bank": "FDRL",
    "South Indian Bank": "SIBL",
    "Karur Vysya Bank": "KVBL",
    "Tamilnad Mercantile Bank": "TMBL",
    "City Union Bank": "CIUB",
    "Dhanlaxmi Bank": "DLXB"
  };
  
  const bankCode = bankCodes[bankName] || "BANK";
  const branchCode = Math.floor(100000 + Math.random() * 900000).toString();
  return `${bankCode}0${branchCode}`;
};

// Generate MICR code (9 digits)
const generateMICR = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

// Generate account number (10-16 digits)
const generateAccountNumber = () => {
  const length = Math.floor(Math.random() * 7) + 10; // 10-16 digits
  let accountNumber = "";
  for (let i = 0; i < length; i++) {
    accountNumber += Math.floor(Math.random() * 10).toString();
  }
  return accountNumber;
};

// Generate bank address
const getBankAddress = (district: string, state: string) => {
  const areas = ["Main Road", "Market Street", "Commercial Complex", "City Center", "Railway Station Road"];
  const area = areas[Math.floor(Math.random() * areas.length)];
  return `${area}, ${district}, ${state} - ${Math.floor(100000 + Math.random() * 900000)}`;
};

async function addBankDetailsToClient(client: any) {
  const bankName = bankNames[Math.floor(Math.random() * bankNames.length)];
  const accountType = Math.random() > 0.7 ? "current" : "savings";
  const accountNumber = generateAccountNumber();
  const ifsc = generateIFSC(bankName);
  const micr = generateMICR();
  const branch = getBankBranch(client.district || "Main", client.state || "India");
  const bankAddress = getBankAddress(client.district || "Main", client.state || "India");
  
  const bankDetails = {
    bankAccountNumber: accountNumber,
    bankIFSC: ifsc,
    bankAccountHolderName: `${client.firstName} ${client.lastName}`,
    bankName: bankName,
    bankBranch: branch,
    bankAddress: bankAddress,
    bankAccountType: accountType,
    bankMICR: micr,
    updatedAt: new Date()
  };
  
  try {
    await db
      .update(users)
      .set(bankDetails)
      .where(eq(users.id, client.id));
    
    console.log(`✅ Added bank details for ${client.firstName} ${client.lastName} (${client.id})`);
  } catch (error) {
    console.error(`❌ Error adding bank details for ${client.id}:`, error);
  }
}

async function addBankDetailsToAllClients() {
  console.log('🚀 Starting to add bank details to all clients...');
  
  try {
    // Get all clients without bank details
    const clientsWithoutBankDetails = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'client'),
          isNull(users.bankAccountNumber)
        )
      );
    
    console.log(`📊 Found ${clientsWithoutBankDetails.length} clients without bank details`);
    
    if (clientsWithoutBankDetails.length === 0) {
      console.log('✅ All clients already have bank details!');
      return;
    }
    
    let processed = 0;
    const batchSize = 10; // Process in batches to avoid overwhelming the database
    
    for (let i = 0; i < clientsWithoutBankDetails.length; i += batchSize) {
      const batch = clientsWithoutBankDetails.slice(i, i + batchSize);
      
      // Process batch concurrently
      await Promise.all(batch.map(client => addBankDetailsToClient(client)));
      
      processed += batch.length;
      console.log(`📈 Progress: ${processed}/${clientsWithoutBankDetails.length} clients processed`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Successfully added bank details to all clients!');
    
    // Verify completion
    const remainingClients = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'client'),
          isNull(users.bankAccountNumber)
        )
      );
    
    console.log(`✅ Verification: ${remainingClients.length} clients still without bank details`);
    
  } catch (error) {
    console.error('❌ Error in addBankDetailsToAllClients:', error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  addBankDetailsToAllClients()
    .then(() => {
      console.log('✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { addBankDetailsToAllClients };