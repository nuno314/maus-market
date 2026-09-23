import { randomBytes } from "crypto";
import { desc, eq, gt, inArray, like, or, sql } from "drizzle-orm";
import { getDb, getSqlite } from "@/lib/db";
import { cards, listings, orderItems, orders, settings } from "@/lib/schema";
import type { PriceSettings } from "@/lib/money";
import type { Condition, Language } from "@/lib/sets";
import { conditionRank, seasonRank } from "@/lib/sets";

export type CardRow = {
  id: string;
  language: Language;
  setId: string;
  setName: string;
  setCode: string;
  seasonKey: string;
  number: string;
  name: string;
  imageUrl: string;
  manual: number;
};

export type ShopListing = {
  id: number;
  cardId: string;
  name: string;
  setName: string;
  setCode: string;
  language: Language;
  seasonKey: string;
  number: string;
  condition: Condition;
  quantity: number;
  priceVnd: number;
  imageUrl: string;
  sourceLabel: string | null;
  sourcePrice: number | null;
  sourceCurrency: "USD" | "JPY";
  sourceUrl: string | null;
};

export type OrderStatus = "new" | "confirmed" | "done" | "cancelled";

export type OrderRow = {
  id: number;
  code: string;
  zaloPhone: string;
  zaloName: string;
  shippingMethod: "manual" | "later";
  shippingAddress: string | null;
  status: OrderStatus;
  createdAt: string;
  itemCount: number;
  totalVnd: number;
};

export type OrderItemRow = {
  id: number;
  cardName: string;
  setName: string;
  setCode: string;
  language: Language;
  condition: Condition;
  imageUrl: string;
  number: string;
  quantity: number;
  unitPriceVnd: number;
};

function asLanguage(value: string): Language {
  return value === "ja" ? "ja" : "en";
}

function asCondition(value: string): Condition {
  if (value === "A-" || value === "B") return value;
  return "A";
}

export function getSettings(): PriceSettings & { ratesUpdatedAt: string | null } {
  const db = getDb();
  const row = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!row) {
    return {
      usdVnd: 25972,
      jpyVnd: 165,
      markupPercent: 0,
      factorA: 1,
      factorAMinus: 0.9,
      factorB: 0.75,
      ratesUpdatedAt: null,
    };
  }
  return {
    usdVnd: row.usdVnd,
    jpyVnd: row.jpyVnd,
    markupPercent: row.markupPercent,
    factorA: row.factorA,
    factorAMinus: row.factorAMinus,
    factorB: row.factorB,
    ratesUpdatedAt: row.ratesUpdatedAt,
  };
}

export function saveSettings(next: PriceSettings) {
  const db = getDb();
  db.update(settings)
    .set({
      usdVnd: next.usdVnd,
      jpyVnd: next.jpyVnd,
      markupPercent: next.markupPercent,
      factorA: next.factorA,
      factorAMinus: next.factorAMinus,
      factorB: next.factorB,
      ratesUpdatedAt: new Date().toISOString(),
    })
    .where(eq(settings.id, 1))
    .run();
}

export function countCards() {
  const db = getDb();
  const row = db.select({ count: sql<number>`count(*)` }).from(cards).get();
  return row?.count ?? 0;
}

export function upsertCatalogCard(card: Omit<CardRow, "manual">) {
  const sqlite = getSqlite();
  sqlite
    .prepare(
      `INSERT INTO cards (id, language, set_id, set_name, set_code, season_key, number, name, image_url, manual)
       VALUES (@id, @language, @setId, @setName, @setCode, @seasonKey, @number, @name, @imageUrl, 0)
       ON CONFLICT(id) DO UPDATE SET
         language = excluded.language,
         set_id = excluded.set_id,
         set_name = excluded.set_name,
         set_code = excluded.set_code,
         season_key = excluded.season_key,
         number = excluded.number,
         name = excluded.name,
         image_url = excluded.image_url
       WHERE cards.manual = 0`,
    )
    .run(card);
}

export function searchCards(query: string): CardRow[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const needle = `%${trimmed.replace(/[%_]/g, "")}%`;
  const db = getDb();
  const rows = db
    .select()
    .from(cards)
    .where(
      or(
        like(cards.name, needle),
        like(sql`lower(${cards.name})`, needle.toLowerCase()),
        like(cards.number, needle),
        like(cards.setCode, needle),
      ),
    )
    .limit(24)
    .all();
  return rows.map(mapCard);
}

export function getCard(id: string): CardRow | null {
  const db = getDb();
  const row = db.select().from(cards).where(eq(cards.id, id)).get();
  return row ? mapCard(row) : null;
}

function mapCard(row: typeof cards.$inferSelect): CardRow {
  return {
    id: row.id,
    language: asLanguage(row.language),
    setId: row.setId,
    setName: row.setName,
    setCode: row.setCode,
    seasonKey: row.seasonKey,
    number: row.number,
    name: row.name,
    imageUrl: row.imageUrl,
    manual: row.manual,
  };
}

export function insertManualCard(input: {
  language: Language;
  setId: string;
  setName: string;
  setCode: string;
  seasonKey: string;
  number: string;
  name: string;
  imageUrl: string;
}): CardRow {
  const id = `manual_${randomBytes(6).toString("hex")}`;
  const db = getDb();
  db.insert(cards)
    .values({
      id,
      language: input.language,
      setId: input.setId,
      setName: input.setName,
      setCode: input.setCode,
      seasonKey: input.seasonKey,
      number: input.number,
      name: input.name.trim(),
      imageUrl: input.imageUrl.trim(),
      manual: 1,
    })
    .run();
  return getCard(id)!;
}

const listingSelect = {
  id: listings.id,
  cardId: listings.cardId,
  name: cards.name,
  setName: cards.setName,
  setCode: cards.setCode,
  language: cards.language,
  seasonKey: cards.seasonKey,
  number: cards.number,
  condition: listings.condition,
  quantity: listings.quantity,
  priceVnd: listings.priceVnd,
  imageUrl: cards.imageUrl,
  sourceLabel: listings.sourceLabel,
  sourcePrice: listings.sourcePrice,
  sourceCurrency: listings.sourceCurrency,
  sourceUrl: listings.sourceUrl,
};

function mapListing(row: {
  id: number;
  cardId: string;
  name: string;
  setName: string;
  setCode: string;
  language: string;
  seasonKey: string;
  number: string;
  condition: string;
  quantity: number;
  priceVnd: number;
  imageUrl: string;
  sourceLabel: string | null;
  sourcePrice: number | null;
  sourceCurrency: string;
  sourceUrl: string | null;
}): ShopListing {
  return {
    ...row,
    language: asLanguage(row.language),
    condition: asCondition(row.condition),
    sourceCurrency: row.sourceCurrency === "JPY" ? "JPY" : "USD",
  };
}

function sortListings(rows: ShopListing[]) {
  return rows.sort((a, b) => {
    const season = seasonRank(a.seasonKey) - seasonRank(b.seasonKey);
    if (season !== 0) return season;
    const number = Number.parseInt(a.number, 10) - Number.parseInt(b.number, 10);
    if (number !== 0) return number;
    return conditionRank(a.condition) - conditionRank(b.condition);
  });
}

export function listShopListings(): ShopListing[] {
  const db = getDb();
  const rows = db
    .select(listingSelect)
    .from(listings)
    .innerJoin(cards, eq(listings.cardId, cards.id))
    .where(gt(listings.quantity, 0))
    .all();
  return sortListings(rows.map(mapListing));
}

export function listAllListings(): ShopListing[] {
  const db = getDb();
  const rows = db
    .select(listingSelect)
    .from(listings)
    .innerJoin(cards, eq(listings.cardId, cards.id))
    .orderBy(desc(listings.updatedAt))
    .all();
  return rows.map(mapListing);
}

export function getListingsByIds(ids: number[]): ShopListing[] {
  if (ids.length === 0) return [];
  const db = getDb();
  const rows = db
    .select(listingSelect)
    .from(listings)
    .innerJoin(cards, eq(listings.cardId, cards.id))
    .where(inArray(listings.id, ids))
    .all();
  return rows.map(mapListing);
}

export function getListing(id: number): ShopListing | null {
  return getListingsByIds([id])[0] ?? null;
}

export function saveListing(input: {
  cardId: string;
  condition: Condition;
  quantity: number;
  sourcePrice: number;
  sourceCurrency: "USD" | "JPY";
  sourceUrl: string | null;
  sourceLabel: string;
  conditionPriced: boolean;
  priceVnd: number;
}) {
  const now = new Date().toISOString();
  const sqlite = getSqlite();
  const existing = sqlite
    .prepare(`SELECT id FROM listings WHERE card_id = ? AND condition = ?`)
    .get(input.cardId, input.condition) as { id: number } | undefined;
  if (existing) {
    throw new Error("DUPLICATE");
  }
  const result = sqlite
    .prepare(
      `INSERT INTO listings (
        card_id, condition, quantity, source_price, source_currency, source_url, source_label,
        condition_priced, price_vnd, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.cardId,
      input.condition,
      input.quantity,
      input.sourcePrice,
      input.sourceCurrency,
      input.sourceUrl,
      input.sourceLabel,
      input.conditionPriced ? 1 : 0,
      input.priceVnd,
      now,
      now,
    );
  return Number(result.lastInsertRowid);
}

export function updateListingQuantity(id: number, quantity: number) {
  const db = getDb();
  db.update(listings)
    .set({ quantity, updatedAt: new Date().toISOString() })
    .where(eq(listings.id, id))
    .run();
}

export function updateListingPrice(
  id: number,
  input: {
    sourcePrice: number;
    sourceCurrency: "USD" | "JPY";
    sourceUrl: string | null;
    sourceLabel: string;
    conditionPriced: boolean;
    priceVnd: number;
  },
) {
  const db = getDb();
  db.update(listings)
    .set({
      sourcePrice: input.sourcePrice,
      sourceCurrency: input.sourceCurrency,
      sourceUrl: input.sourceUrl,
      sourceLabel: input.sourceLabel,
      conditionPriced: input.conditionPriced ? 1 : 0,
      priceVnd: input.priceVnd,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(listings.id, id))
    .run();
}

export function deleteListing(id: number) {
  const db = getDb();
  db.delete(listings).where(eq(listings.id, id)).run();
}

export function countNewOrders() {
  const db = getDb();
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "new"))
    .get();
  return row?.count ?? 0;
}

export function listOrders(): OrderRow[] {
  const sqlite = getSqlite();
  const rows = sqlite
    .prepare(
      `SELECT o.id, o.code, o.zalo_phone as zaloPhone, o.zalo_name as zaloName,
              o.shipping_method as shippingMethod, o.shipping_address as shippingAddress,
              o.status, o.created_at as createdAt,
              COUNT(i.id) as itemCount,
              COALESCE(SUM(i.quantity * i.unit_price_vnd), 0) as totalVnd
       FROM orders o
       LEFT JOIN order_items i ON i.order_id = o.id
       GROUP BY o.id
       ORDER BY o.id DESC`,
    )
    .all() as OrderRow[];
  return rows.map((row) => ({
    ...row,
    shippingMethod: row.shippingMethod === "manual" ? "manual" : "later",
    status: row.status as OrderStatus,
    itemCount: Number(row.itemCount),
    totalVnd: Number(row.totalVnd),
  }));
}

export function getOrder(id: number): (OrderRow & { items: OrderItemRow[] }) | null {
  const db = getDb();
  const order = db.select().from(orders).where(eq(orders.id, id)).get();
  if (!order) return null;
  const items = db.select().from(orderItems).where(eq(orderItems.orderId, id)).all();
  const totalVnd = items.reduce((sum, item) => sum + item.quantity * item.unitPriceVnd, 0);
  return {
    id: order.id,
    code: order.code,
    zaloPhone: order.zaloPhone,
    zaloName: order.zaloName,
    shippingMethod: order.shippingMethod === "manual" ? "manual" : "later",
    shippingAddress: order.shippingAddress,
    status: order.status as OrderStatus,
    createdAt: order.createdAt,
    itemCount: items.length,
    totalVnd,
    items: items.map((item) => ({
      id: item.id,
      cardName: item.cardName,
      setName: item.setName,
      setCode: item.setCode,
      language: asLanguage(item.language),
      condition: asCondition(item.condition),
      imageUrl: item.imageUrl,
      number: item.number,
      quantity: item.quantity,
      unitPriceVnd: item.unitPriceVnd,
    })),
  };
}

export function getOrderByCode(code: string) {
  const db = getDb();
  const order = db.select().from(orders).where(eq(orders.code, code)).get();
  if (!order) return null;
  return getOrder(order.id);
}

export function setOrderStatus(id: number, status: OrderStatus) {
  const sqlite = getSqlite();
  const current = sqlite.prepare(`SELECT status FROM orders WHERE id = ?`).get(id) as
    | { status: OrderStatus }
    | undefined;
  if (!current) return;
  if (current.status !== "cancelled" && status === "cancelled") {
    const items = sqlite
      .prepare(`SELECT listing_id as listingId, quantity FROM order_items WHERE order_id = ?`)
      .all(id) as { listingId: number | null; quantity: number }[];
    const restore = sqlite.transaction(() => {
      for (const item of items) {
        if (!item.listingId) continue;
        sqlite
          .prepare(`UPDATE listings SET quantity = quantity + ?, updated_at = ? WHERE id = ?`)
          .run(item.quantity, new Date().toISOString(), item.listingId);
      }
      sqlite.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
    });
    restore();
    return;
  }
  sqlite.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
}

export type CheckoutLine = { listingId: number; quantity: number };

export function placeOrder(input: {
  lines: CheckoutLine[];
  zaloPhone: string;
  zaloName: string;
  shippingMethod: "manual" | "later";
  shippingAddress: string | null;
}): { code: string } {
  const sqlite = getSqlite();
  const code = makeOrderCode(sqlite);
  const now = new Date().toISOString();
  const run = sqlite.transaction(() => {
    const snapshots: {
      listingId: number;
      cardName: string;
      setName: string;
      setCode: string;
      language: string;
      condition: string;
      imageUrl: string;
      number: string;
      quantity: number;
      unitPriceVnd: number;
    }[] = [];

    for (const line of input.lines) {
      const row = sqlite
        .prepare(
          `SELECT l.id, l.quantity, l.price_vnd as priceVnd, l.condition,
                  c.name as cardName, c.set_name as setName, c.set_code as setCode,
                  c.language, c.image_url as imageUrl, c.number
           FROM listings l JOIN cards c ON c.id = l.card_id
           WHERE l.id = ?`,
        )
        .get(line.listingId) as
        | {
            id: number;
            quantity: number;
            priceVnd: number;
            condition: string;
            cardName: string;
            setName: string;
            setCode: string;
            language: string;
            imageUrl: string;
            number: string;
          }
        | undefined;
      if (!row) {
        throw new Error("Một lá trong giỏ không còn trên shop.");
      }
      if (line.quantity < 1 || line.quantity > row.quantity) {
        throw new Error(`${row.cardName} (${row.condition}) chỉ còn ${row.quantity} lá.`);
      }
      sqlite
        .prepare(`UPDATE listings SET quantity = quantity - ?, updated_at = ? WHERE id = ?`)
        .run(line.quantity, now, row.id);
      snapshots.push({
        listingId: row.id,
        cardName: row.cardName,
        setName: row.setName,
        setCode: row.setCode,
        language: row.language,
        condition: row.condition,
        imageUrl: row.imageUrl,
        number: row.number,
        quantity: line.quantity,
        unitPriceVnd: row.priceVnd,
      });
    }

    const order = sqlite
      .prepare(
        `INSERT INTO orders (code, zalo_phone, zalo_name, shipping_method, shipping_address, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'new', ?)`,
      )
      .run(code, input.zaloPhone, input.zaloName, input.shippingMethod, input.shippingAddress, now);
    const orderId = Number(order.lastInsertRowid);
    const insertItem = sqlite.prepare(
      `INSERT INTO order_items (
        order_id, listing_id, card_name, set_name, set_code, language, condition, image_url, number, quantity, unit_price_vnd
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const item of snapshots) {
      insertItem.run(
        orderId,
        item.listingId,
        item.cardName,
        item.setName,
        item.setCode,
        item.language,
        item.condition,
        item.imageUrl,
        item.number,
        item.quantity,
        item.unitPriceVnd,
      );
    }
  });
  run();
  return { code };
}

function makeOrderCode(sqlite: ReturnType<typeof getSqlite>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bytes = randomBytes(6);
    let body = "";
    for (let i = 0; i < 6; i += 1) body += alphabet[bytes[i]! % alphabet.length];
    const code = `MC-${body}`;
    const exists = sqlite.prepare(`SELECT 1 FROM orders WHERE code = ?`).get(code);
    if (!exists) return code;
  }
  return `MC-${Date.now().toString(36).toUpperCase()}`;
}
