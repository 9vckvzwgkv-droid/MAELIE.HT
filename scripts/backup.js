import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "..");
const src = path.join(root, "data", "maelie.sqlite");
if (!fs.existsSync(src)) throw new Error("Base SQLite introuvable. Lancez le serveur une première fois.");

// Le mode WAL peut conserver des écritures dans maelie.sqlite-wal.
// On force un checkpoint avant la copie afin que la sauvegarde soit cohérente.
const db = new Database(src);
try { db.pragma("wal_checkpoint(TRUNCATE)"); } finally { db.close(); }

const out = path.join(root, "backups");
fs.mkdirSync(out, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(out, `maelie-${stamp}.sqlite`);
fs.copyFileSync(src, dest);

const keep = Math.max(1, Number(process.env.BACKUP_RETENTION || 14));
const files = fs.readdirSync(out)
  .filter((f) => /^maelie-.*\.sqlite$/.test(f))
  .map((f) => ({ f, t: fs.statSync(path.join(out, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);
for (const item of files.slice(keep)) fs.unlinkSync(path.join(out, item.f));

console.log(`Sauvegarde créée : ${dest}`);
