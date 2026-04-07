import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("NEON_DATABASE_URL is required.");
  process.exit(1);
}

const sqlPath = path.join(__dirname, "..", "db", "seed.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

function stripLeadingComments(block) {
  return block
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

const statements = sql
  .split(/;\s*\n/)
  .map((s) => stripLeadingComments(s))
  .filter((s) => s.length > 0);

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  for (const st of statements) {
    await pool.query(st.endsWith(";") ? st : `${st};`);
  }
  console.log(`Applied ${statements.length} seed statement(s).`);
} finally {
  await pool.end();
}
