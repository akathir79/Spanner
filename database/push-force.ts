import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function pushChanges() {
  try {
    console.log('Pushing database changes...');
    
    // Create advertisements table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        image TEXT,
        target_audience TEXT NOT NULL,
        link TEXT,
        button_text TEXT,
        background_color TEXT,
        text_color TEXT,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_by VARCHAR REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    console.log('✅ Advertisements table created/verified');
    
    // Drop the address column if it exists
    await pool.query(`
      ALTER TABLE users DROP COLUMN IF EXISTS address CASCADE
    `).catch(err => {
      console.log('Note: address column may not exist, continuing...');
    });
    
    console.log('✅ Database schema updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error pushing database changes:', error);
    process.exit(1);
  }
}

pushChanges();