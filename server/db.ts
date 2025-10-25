import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please ensure the database is provisioned.");
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // set true if using SSL certificates
});

// Initialize Drizzle ORM with schema
export const db = drizzle(pool, { schema });

// Optional: test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL successfully!");
    const result = await client.query("SELECT current_database(), current_user, NOW()");
    console.log("📊 Result:", result.rows[0]);
    client.release();
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
})();
