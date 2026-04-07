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

/** Split on semicolons that are outside dollar-quoted bodies ($$ ... $$ or $tag$ ... $tag$). */
function splitPgStatements(sql) {
  const out = [];
  let buf = "";
  let i = 0;
  let delim = null;

  while (i < sql.length) {
    if (delim) {
      if (sql.startsWith(delim, i)) {
        buf += delim;
        i += delim.length;
        delim = null;
      } else {
        buf += sql[i++];
      }
      continue;
    }

    if (sql[i] === "$") {
      const sub = sql.slice(i);
      const m = sub.match(/^\$([a-zA-Z0-9_]*)\$/);
      if (m) {
        delim = m[0];
        buf += delim;
        i += delim.length;
        continue;
      }
    }

    if (sql[i] === ";") {
      const next = sql[i + 1];
      if (next === "\n" || next === "\r" || next === undefined || i === sql.length - 1) {
        const t = buf.trim();
        if (t.length) out.push(t);
        buf = "";
        i++;
        while (i < sql.length && (sql[i] === "\n" || sql[i] === "\r" || sql[i] === " " || sql[i] === "\t")) i++;
        continue;
      }
    }

    buf += sql[i++];
  }
  const t = buf.trim();
  if (t.length) out.push(t);
  return out;
}

function stripLeadingLineComments(stmt) {
  const lines = stmt.split("\n");
  while (lines.length && /^\s*--/.test(lines[0])) lines.shift();
  return lines.join("\n").trim();
}

async function tableExists(pool, tableName) {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return r.rowCount > 0;
}

/** Fresh databases have no tables; migrations only ALTER/extend and assume base schema from db/schema.sql. */
async function ensureBaseSchema(pool) {
  if (await tableExists(pool, "reference_options")) {
    console.log("Base schema already present (reference_options exists). Skipping db/schema.sql.");
    return;
  }
  console.log("Fresh database: applying db/schema.sql first …");
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const raw = fs.readFileSync(schemaPath, "utf8");
  const statements = splitPgStatements(raw).map(stripLeadingLineComments).filter(Boolean);
  for (const st of statements) {
    await pool.query(st.endsWith(";") ? st : `${st};`);
  }
  console.log(`OK: schema.sql (${statements.length} statement(s))`);
}

const dir = path.join(__dirname, "..", "db", "migrations");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await ensureBaseSchema(pool);
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const statements = splitPgStatements(raw).map(stripLeadingLineComments).filter(Boolean);
    for (const st of statements) {
      await pool.query(st.endsWith(";") ? st : `${st};`);
    }
    console.log(`OK: ${file} (${statements.length} statement(s))`);
  }
} finally {
  await pool.end();
}
