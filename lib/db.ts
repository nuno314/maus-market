import fs from "fs";
import path from "path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
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
  manual INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'card',
  description TEXT NOT NULL DEFAULT ''
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
  category TEXT NOT NULL DEFAULT 'card',
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL,
  unit_price_vnd INTEGER NOT NULL
);
`;

type Db = ReturnType<typeof drizzle<typeof schema>>;

const SCHEMA_VERSION = 2;

const globalForDb = globalThis as unknown as {
  mausClient?: Promise<Client>;
  mausDb?: Db;
  schemaVersion?: number;
};

function databaseUrl() {
  const remote = process.env.TURSO_DATABASE_URL?.trim();
  if (remote) return remote;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return `file:${path.join(dir, "maus.db").replace(/\\/g, "/")}`;
}

function isRemote(url: string) {
  return !url.startsWith("file:");
}

async function columnNames(client: Client, table: string) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.map((row) => String(row.name));
}

async function openDatabase() {
  const url = databaseUrl();
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
    timeout: 5000,
  });
  if (!isRemote(url)) {
    await client.execute("PRAGMA journal_mode = WAL");
    await client.execute("PRAGMA foreign_keys = ON");
  }
  await client.executeMultiple(SCHEMA_SQL);
  const cards = await columnNames(client, "cards");
  if (!cards.includes("category")) {
    await client.execute(`ALTER TABLE cards ADD COLUMN category TEXT NOT NULL DEFAULT 'card'`);
  }
  const items = await columnNames(client, "order_items");
  if (!items.includes("category")) {
    await client.execute(`ALTER TABLE order_items ADD COLUMN category TEXT NOT NULL DEFAULT 'card'`);
  }
  if (!cards.includes("description")) {
    await client.execute(`ALTER TABLE cards ADD COLUMN description TEXT NOT NULL DEFAULT ''`);
  }
  if (!items.includes("description")) {
    await client.execute(`ALTER TABLE order_items ADD COLUMN description TEXT NOT NULL DEFAULT ''`);
  }
  const settings = await client.execute("SELECT id FROM settings WHERE id = 1");
  if (settings.rows.length === 0) {
    await client.execute(
      `INSERT INTO settings (id, usd_vnd, jpy_vnd, markup_percent, factor_a, factor_a_minus, factor_b, rates_updated_at)
       VALUES (1, 25972, 165, 0, 1, 0.9, 0.75, NULL)`,
    );
  }
  return client;
}

export function getClient() {
  if (!globalForDb.mausClient || globalForDb.schemaVersion !== SCHEMA_VERSION) {
    globalForDb.schemaVersion = SCHEMA_VERSION;
    globalForDb.mausDb = undefined;
    globalForDb.mausClient = openDatabase().catch((error) => {
      globalForDb.mausClient = undefined;
      globalForDb.schemaVersion = undefined;
      throw error;
    });
  }
  return globalForDb.mausClient;
}

export async function getDb() {
  const client = await getClient();
  if (!globalForDb.mausDb) {
    globalForDb.mausDb = drizzle(client, { schema });
  }
  return globalForDb.mausDb;
}
