import { randomBytes } from "crypto";
import { desc, eq, gt, inArray, like, or, sql } from "drizzle-orm";
import type { Client } from "@libsql/client";
import { getClient, getDb } from "@/lib/db";
import { cards, listings, orderItems, orders, settings } from "@/lib/schema";
import type { PriceSettings } from "@/lib/money";
import type { Category, Condition, Language } from "@/lib/sets";
import { parseStoredImages } from "@/lib/images";
import { asCategory, conditionRank, seasonRank } from "@/lib/sets";

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
  images: string[];
  manual: number;
  category: Category;
  description: string;
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
  category: Category;
  condition: Condition;
  quantity: number;
  priceVnd: number;
  imageUrl: string;
  images: string[];
  manual: number;
  description: string;
  sourceLabel: string | null;
  sourcePrice: number | null;
  sourceCurrency: "USD" | "JPY" | "VND";
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
  category: Category;
  description: string;
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

export async function getSettings(): Promise<PriceSettings & { ratesUpdatedAt: string | null }> {
  const db = await getDb();
  const row = await db.select().from(settings).where(eq(settings.id, 1)).get();
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

export async function saveSettings(next: PriceSettings) {
  const db = await getDb();
  await db.update(settings)
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

export async function countCards() {
  const db = await getDb();
  const row = await db.select({ count: sql<number>`count(*)` }).from(cards).get();
  return row?.count ?? 0;
}

export async function upsertCatalogCard(card: Omit<CardRow, "manual" | "category" | "description" | "images">) {
  const client = await getClient();
  await client.execute({
    sql: `INSERT INTO cards (id, language, set_id, set_name, set_code, season_key, number, name, image_url, manual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
    args: [
      card.id,
      card.language,
      card.setId,
      card.setName,
      card.setCode,
      card.seasonKey,
      card.number,
      card.name,
      card.imageUrl,
    ],
  });
}

export async function searchCards(query: string): Promise<CardRow[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const needle = `%${trimmed.replace(/[%_]/g, "")}%`;
  const db = await getDb();
  const rows = await db
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

export async function getCard(id: string): Promise<CardRow | null> {
  const db = await getDb();
  const row = await db.select().from(cards).where(eq(cards.id, id)).get();
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
    images: parseStoredImages(row.images, row.imageUrl),
    manual: row.manual,
    category: asCategory(row.category),
    description: row.description ?? "",
  };
}

export async function insertManualCard(input: {
  language: Language;
  setId: string;
  setName: string;
  setCode: string;
  seasonKey: string;
  number: string;
  name: string;
  imageUrl: string;
  images?: string[];
  category: Category;
  description: string;
}): Promise<CardRow> {
  const id = `manual_${randomBytes(6).toString("hex")}`;
  const db = await getDb();
  await db.insert(cards)
    .values({
      id,
      language: input.language,
      setId: input.setId,
      setName: input.setName,
      setCode: input.setCode,
      seasonKey: input.seasonKey,
      number: input.number,
      name: input.name.trim(),
      imageUrl: (input.images?.[0] ?? input.imageUrl).trim(),
      images: JSON.stringify((input.images?.length ? input.images : [input.imageUrl]).map((url) => url.trim())),
      manual: 1,
      category: input.category,
      description: input.description.trim(),
    })
    .run();
  return (await getCard(id))!;
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
  category: cards.category,
  condition: listings.condition,
  quantity: listings.quantity,
  priceVnd: listings.priceVnd,
  imageUrl: cards.imageUrl,
  images: cards.images,
  manual: cards.manual,
  description: cards.description,
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
  category: string;
  condition: string;
  quantity: number;
  priceVnd: number;
  imageUrl: string;
  images: string;
  manual: number;
  description: string;
  sourceLabel: string | null;
  sourcePrice: number | null;
  sourceCurrency: string;
  sourceUrl: string | null;
}): ShopListing {
  const images = parseStoredImages(row.images, row.imageUrl);
  return {
    ...row,
    imageUrl: images[0] || row.imageUrl,
    images,
    manual: row.manual,
    language: asLanguage(row.language),
    category: asCategory(row.category),
    condition: asCondition(row.condition),
    sourceCurrency: row.sourceCurrency === "JPY" ? "JPY" : row.sourceCurrency === "VND" ? "VND" : "USD",
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

export async function listShopListings(): Promise<ShopListing[]> {
  const db = await getDb();
  const rows = await db
    .select(listingSelect)
    .from(listings)
    .innerJoin(cards, eq(listings.cardId, cards.id))
    .where(gt(listings.quantity, 0))
    .all();
  return sortListings(rows.map(mapListing));
}

export async function listAllListings(): Promise<ShopListing[]> {
  const db = await getDb();
  const rows = await db
    .select(listingSelect)
    .from(listings)
    .innerJoin(cards, eq(listings.cardId, cards.id))
    .orderBy(desc(listings.updatedAt))
    .all();
  return rows.map(mapListing);
}

export async function getListingsByIds(ids: number[]): Promise<ShopListing[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .select(listingSelect)
    .from(listings)
    .innerJoin(cards, eq(listings.cardId, cards.id))
    .where(inArray(listings.id, ids))
    .all();
  return rows.map(mapListing);
}

export async function getListing(id: number): Promise<ShopListing | null> {
  return (await getListingsByIds([id]))[0] ?? null;
}

export async function saveListing(input: {
  cardId: string;
  condition: Condition;
  quantity: number;
  sourcePrice: number;
  sourceCurrency: "USD" | "JPY" | "VND";
  sourceUrl: string | null;
  sourceLabel: string;
  conditionPriced: boolean;
  priceVnd: number;
}) {
  const now = new Date().toISOString();
  const client = await getClient();
  const existing = await client.execute({
    sql: `SELECT id FROM listings WHERE card_id = ? AND condition = ?`,
    args: [input.cardId, input.condition],
  });
  if (existing.rows[0]) {
    throw new Error("DUPLICATE");
  }
  const result = await client.execute({
    sql: `INSERT INTO listings (
        card_id, condition, quantity, source_price, source_currency, source_url, source_label,
        condition_priced, price_vnd, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
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
    ],
  });
  return Number(result.lastInsertRowid);
}

export async function updateListedProduct(input: {
  listingId: number;
  manual: boolean;
  name: string;
  description: string;
  category: Category;
  language: Language;
  setId: string;
  setName: string;
  setCode: string;
  seasonKey: string;
  number: string;
  condition: Condition;
  quantity: number;
  priceVnd: number | null;
  images: string[];
}): Promise<"ok" | "missing" | "duplicate"> {
  const listing = await getListing(input.listingId);
  if (!listing) return "missing";
  const client = await getClient();
  if (input.condition !== listing.condition) {
    const clash = await client.execute({
      sql: `SELECT id FROM listings WHERE card_id = ? AND condition = ? AND id != ?`,
      args: [listing.cardId, input.condition, input.listingId],
    });
    if (clash.rows[0]) return "duplicate";
  }
  const db = await getDb();
  const now = new Date().toISOString();
  if (input.manual) {
    await db
      .update(cards)
      .set({
        name: input.name,
        description: input.description,
        category: input.category,
        language: input.language,
        setId: input.setId,
        setName: input.setName,
        setCode: input.setCode,
        seasonKey: input.seasonKey,
        number: input.number,
        imageUrl: input.images[0] ?? "",
        images: JSON.stringify(input.images),
      })
      .where(eq(cards.id, listing.cardId))
      .run();
  } else {
    await db
      .update(cards)
      .set({
        description: input.description,
        images: JSON.stringify(input.images),
      })
      .where(eq(cards.id, listing.cardId))
      .run();
  }
  await db
    .update(listings)
    .set({
      condition: input.condition,
      quantity: input.quantity,
      updatedAt: now,
      ...(input.priceVnd !== null
        ? {
            priceVnd: input.priceVnd,
            sourcePrice: input.priceVnd,
            sourceCurrency: "VND",
            sourceLabel: "Giá nhập tay",
            conditionPriced: 1,
          }
        : {}),
    })
    .where(eq(listings.id, input.listingId))
    .run();
  return "ok";
}

export async function updateListingQuantity(id: number, quantity: number) {
  const db = await getDb();
  await db.update(listings)
    .set({ quantity, updatedAt: new Date().toISOString() })
    .where(eq(listings.id, id))
    .run();
}

export async function updateListingPrice(
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
  const db = await getDb();
  await db.update(listings)
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

export async function deleteListing(id: number) {
  const db = await getDb();
  await db.delete(listings).where(eq(listings.id, id)).run();
}

export async function countNewOrders() {
  const db = await getDb();
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "new"))
    .get();
  return row?.count ?? 0;
}

export async function listUserOrders(userId: number): Promise<OrderRow[]> {
  const client = await getClient();
  const result = await client.execute({
    sql: `SELECT o.id, o.code, o.zalo_phone as zaloPhone, o.zalo_name as zaloName,
            o.shipping_method as shippingMethod, o.shipping_address as shippingAddress,
            o.status, o.created_at as createdAt,
            COUNT(i.id) as itemCount,
            COALESCE(SUM(i.quantity * i.unit_price_vnd), 0) as totalVnd
     FROM orders o
     LEFT JOIN order_items i ON i.order_id = o.id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.id DESC`,
    args: [userId],
  });
  return result.rows.map((row) => {
    const item = row as unknown as OrderRow;
    return {
      ...item,
      id: Number(item.id),
      shippingMethod: item.shippingMethod === "manual" ? "manual" : "later",
      status: item.status as OrderStatus,
      itemCount: Number(item.itemCount),
      totalVnd: Number(item.totalVnd),
    };
  });
}

export async function listOrders(): Promise<OrderRow[]> {
  const client = await getClient();
  const result = await client.execute(
    `SELECT o.id, o.code, o.zalo_phone as zaloPhone, o.zalo_name as zaloName,
            o.shipping_method as shippingMethod, o.shipping_address as shippingAddress,
            o.status, o.created_at as createdAt,
            COUNT(i.id) as itemCount,
            COALESCE(SUM(i.quantity * i.unit_price_vnd), 0) as totalVnd
     FROM orders o
     LEFT JOIN order_items i ON i.order_id = o.id
     GROUP BY o.id
     ORDER BY o.id DESC`,
  );
  return result.rows.map((row) => {
    const item = row as unknown as OrderRow;
    return {
      ...item,
      id: Number(item.id),
      shippingMethod: item.shippingMethod === "manual" ? "manual" : "later",
      status: item.status as OrderStatus,
      itemCount: Number(item.itemCount),
      totalVnd: Number(item.totalVnd),
    };
  });
}

export async function getOrder(id: number): Promise<(OrderRow & { items: OrderItemRow[] }) | null> {
  const db = await getDb();
  const order = await db.select().from(orders).where(eq(orders.id, id)).get();
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id)).all();
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
      category: asCategory(item.category),
      description: item.description ?? "",
      quantity: item.quantity,
      unitPriceVnd: item.unitPriceVnd,
    })),
  };
}

export async function getOrderByCode(code: string) {
  const db = await getDb();
  const order = await db.select().from(orders).where(eq(orders.code, code)).get();
  if (!order) return null;
  return getOrder(order.id);
}

export async function setOrderStatus(id: number, status: OrderStatus) {
  const client = await getClient();
  const currentResult = await client.execute({
    sql: `SELECT status FROM orders WHERE id = ?`,
    args: [id],
  });
  const current = currentResult.rows[0] as unknown as { status: OrderStatus } | undefined;
  if (!current) return;
  if (current.status !== "cancelled" && status === "cancelled") {
    const itemResult = await client.execute({
      sql: `SELECT listing_id as listingId, quantity FROM order_items WHERE order_id = ?`,
      args: [id],
    });
    const tx = await client.transaction("write");
    const now = new Date().toISOString();
    try {
      for (const item of itemResult.rows as unknown as { listingId: number | null; quantity: number }[]) {
        if (!item.listingId) continue;
        await tx.execute({
          sql: `UPDATE listings SET quantity = quantity + ?, updated_at = ? WHERE id = ?`,
          args: [Number(item.quantity), now, Number(item.listingId)],
        });
      }
      await tx.execute({
        sql: `UPDATE orders SET status = ? WHERE id = ?`,
        args: [status, id],
      });
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      tx.close();
    }
    return;
  }
  await client.execute({
    sql: `UPDATE orders SET status = ? WHERE id = ?`,
    args: [status, id],
  });
}

export type CheckoutLine = { listingId: number; quantity: number };

export async function placeOrder(input: {
  lines: CheckoutLine[];
  zaloPhone: string;
  zaloName: string;
  shippingMethod: "manual" | "later";
  shippingAddress: string | null;
  userId: number | null;
}): Promise<{ code: string }> {
  const client = await getClient();
  const code = await makeOrderCode(client);
  const now = new Date().toISOString();
  const tx = await client.transaction("write");
  try {
    await writeOrder(tx, input, code, now);
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  return { code };
}

async function writeOrder(
  sqlite: Pick<Client, "execute">,
  input: {
    lines: CheckoutLine[];
    zaloPhone: string;
    zaloName: string;
    shippingMethod: "manual" | "later";
    shippingAddress: string | null;
    userId: number | null;
  },
  code: string,
  now: string,
) {
    const snapshots: {
      listingId: number;
      cardName: string;
      setName: string;
      setCode: string;
      language: string;
      condition: string;
      imageUrl: string;
      number: string;
      category: string;
      description: string;
      quantity: number;
      unitPriceVnd: number;
    }[] = [];

  for (const line of input.lines) {
    const found = await sqlite.execute({
      sql: `SELECT l.id, l.quantity, l.price_vnd as priceVnd, l.condition,
                  c.name as cardName, c.set_name as setName, c.set_code as setCode,
                  c.language, c.image_url as imageUrl, c.number, c.category as category, c.description as description
           FROM listings l JOIN cards c ON c.id = l.card_id
           WHERE l.id = ?`,
      args: [line.listingId],
    });
    const row = found.rows[0] as unknown as
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
          category: string;
          description: string;
        }
      | undefined;
    if (!row) {
      throw new Error("Một sản phẩm trong giỏ không còn trên shop.");
    }
    const quantityLeft = Number(row.quantity);
    if (line.quantity < 1 || line.quantity > quantityLeft) {
      const left =
        row.category === "card"
          ? `${row.cardName} (${row.condition}) chỉ còn ${quantityLeft} lá.`
          : `${row.cardName} chỉ còn ${quantityLeft}.`;
      throw new Error(left);
    }
    await sqlite.execute({
      sql: `UPDATE listings SET quantity = quantity - ?, updated_at = ? WHERE id = ?`,
      args: [line.quantity, now, Number(row.id)],
    });
    snapshots.push({
      listingId: Number(row.id),
      cardName: row.cardName,
      setName: row.setName,
      setCode: row.setCode,
      language: row.language,
      condition: row.condition,
      imageUrl: row.imageUrl,
      number: row.number,
      category: row.category,
      description: row.description ?? "",
      quantity: line.quantity,
      unitPriceVnd: Number(row.priceVnd),
    });
  }

  const order = await sqlite.execute({
    sql: `INSERT INTO orders (code, zalo_phone, zalo_name, shipping_method, shipping_address, status, created_at, user_id)
         VALUES (?, ?, ?, ?, ?, 'new', ?, ?)`,
    args: [code, input.zaloPhone, input.zaloName, input.shippingMethod, input.shippingAddress, now, input.userId],
  });
  const orderId = Number(order.lastInsertRowid);
  for (const item of snapshots) {
    await sqlite.execute({
      sql: `INSERT INTO order_items (
        order_id, listing_id, card_name, set_name, set_code, language, condition, image_url, number, category, description, quantity, unit_price_vnd
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orderId,
        item.listingId,
        item.cardName,
        item.setName,
        item.setCode,
        item.language,
        item.condition,
        item.imageUrl,
        item.number,
        item.category,
        item.description,
        item.quantity,
        item.unitPriceVnd,
      ],
    });
  }
}

async function makeOrderCode(sqlite: Pick<Client, "execute">) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bytes = randomBytes(6);
    let body = "";
    for (let i = 0; i < 6; i += 1) body += alphabet[bytes[i]! % alphabet.length];
    const code = `MC-${body}`;
    const exists = await sqlite.execute({ sql: `SELECT 1 FROM orders WHERE code = ?`, args: [code] });
    if (exists.rows.length === 0) return code;
  }
  return `MC-${Date.now().toString(36).toUpperCase()}`;
}
