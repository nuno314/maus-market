import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/schema";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  usd_vnd REAL NOT NULL,
  jpy_vnd REAL NOT NULL,
  markup_percent REAL NOT NULL,
  factor_a REAL NOT NULL,
  factor_a_minus REAL NOT NULL,
  factor_b REAL NOT NULL,
  rates_updated_at TEXT
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  set_id TEXT NOT NULL,
  set_name TEXT NOT NULL,
  set_code TEXT NOT NULL,
  season_key TEXT NOT NULL,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  manual INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS cards_season ON cards(season_key);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  condition TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  source_price REAL,
  source_currency TEXT NOT NULL,
  source_url TEXT,
  source_label TEXT,
  condition_priced INTEGER NOT NULL DEFAULT 0,
  price_vnd INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(card_id, condition)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  zalo_phone TEXT NOT NULL,
  zalo_name TEXT NOT NULL,
  shipping_method TEXT NOT NULL,
  shipping_address TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  listing_id INTEGER,
  card_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  set_code TEXT NOT NULL,
  language TEXT NOT NULL,
  condition TEXT NOT NULL,
  image_url TEXT NOT NULL,
  number TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_vnd INTEGER NOT NULL
);
`;

type Sql = Database.Database;

const globalForDb = globalThis as unknown as {
  mausSqlite?: Sql;
  mausDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function openDatabase() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(path.join(dir, "maus.db"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(SCHEMA_SQL);
  const existing = sqlite.prepare("SELECT id FROM settings WHERE id = 1").get();
  if (!existing) {
    sqlite
      .prepare(
        `INSERT INTO settings (id, usd_vnd, jpy_vnd, markup_percent, factor_a, factor_a_minus, factor_b, rates_updated_at)
         VALUES (1, 25972, 165, 0, 1, 0.9, 0.75, NULL)`,
      )
      .run();
  }
  return sqlite;
}

export function getSqlite(): Sql {
  if (!globalForDb.mausSqlite) globalForDb.mausSqlite = openDatabase();
  return globalForDb.mausSqlite;
}

export function getDb() {
  if (!globalForDb.mausDb) {
    globalForDb.mausDb = drizzle(getSqlite(), { schema });
  }
  return globalForDb.mausDb;
}
