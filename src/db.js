import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const { Pool } = pg;

// Use DATABASE_URL if available (recommended for Render), otherwise use individual params
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'your_password',
      database: process.env.DB_NAME || 'restaurant_bot',
      port: parseInt(process.env.DB_PORT) || 5432
    });

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

export default pool;
