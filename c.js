import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL successfully!");
    const res = await client.query("SELECT current_database(), current_user, now()");
    console.log("📊 Result:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    process.exit();
  }
}

testConnection();
