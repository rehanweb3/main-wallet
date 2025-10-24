import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please ensure the database is provisioned.");
}

const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_HJrBsgjKq9b8@ep-mute-river-a6dxtsw0.us-west-2.aws.neon.tech/neondb?sslmode=require");
export const db = drizzle(sql, { schema });
