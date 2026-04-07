/**
 * Creates or updates the bootstrap administrator (env-driven; never commit real passwords).
 *
 * Required: NEON_DATABASE_URL, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD
 * Optional: BOOTSTRAP_ADMIN_FULL_NAME (default "Administrator")
 *
 * If the database already has users, set BOOTSTRAP_FORCE=1 to upsert this admin (password reset + role).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const url = process.env.NEON_DATABASE_URL;
const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "";
const fullName = (process.env.BOOTSTRAP_ADMIN_FULL_NAME || "Administrator").trim();
const force = process.env.BOOTSTRAP_FORCE === "1";

if (!url) {
  console.error("NEON_DATABASE_URL is required.");
  process.exit(1);
}
if (!email || !password) {
  console.error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM users`);
  const count = rows[0]?.c ?? 0;
  if (count > 0 && !force) {
    console.log(
      "Database already has users. To create/update the bootstrap admin anyway, run with BOOTSTRAP_FORCE=1 in the environment."
    );
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, account_status, approved_at, approved_by)
     VALUES ($1, $2, $3, 'admin', 'approved', NOW(), NULL)
     ON CONFLICT (email) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       account_status = 'approved',
       approved_at = COALESCE(users.approved_at, NOW())
     RETURNING id, email`,
    [fullName, email, hash]
  );
  const id = result.rows[0].id;
  await pool.query(`INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [id]);
  console.log(`Bootstrap admin ready: ${result.rows[0].email}`);
} finally {
  await pool.end();
}
