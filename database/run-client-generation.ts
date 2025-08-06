#!/usr/bin/env tsx

import { generateClients } from "./generate-clients";

async function main() {
  try {
    console.log("🚀 Starting client generation process...");
    const totalGenerated = await generateClients();
    console.log(`✅ Successfully generated ${totalGenerated} clients across all states and districts`);
  } catch (error) {
    console.error("❌ Failed to generate clients:", error);
    process.exit(1);
  }
}

main();