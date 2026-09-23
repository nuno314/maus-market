import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  usdVnd: real("usd_vnd").notNull(),
  jpyVnd: real("jpy_vnd").notNull(),
  markupPercent: real("markup_percent").notNull(),
  factorA: real("factor_a").notNull(),
  factorAMinus: real("factor_a_minus").notNull(),
  factorB: real("factor_b").notNull(),
  ratesUpdatedAt: text("rates_updated_at"),
});

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  language: text("language").notNull(),
  setId: text("set_id").notNull(),
  setName: text("set_name").notNull(),
  setCode: text("set_code").notNull(),
  seasonKey: text("season_key").notNull(),
  number: text("number").notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  manual: integer("manual").notNull().default(0),
});

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: text("card_id").notNull(),
  condition: text("condition").notNull(),
  quantity: integer("quantity").notNull(),
  sourcePrice: real("source_price"),
  sourceCurrency: text("source_currency").notNull(),
  sourceUrl: text("source_url"),
  sourceLabel: text("source_label"),
  conditionPriced: integer("condition_priced").notNull().default(0),
  priceVnd: integer("price_vnd").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  zaloPhone: text("zalo_phone").notNull(),
  zaloName: text("zalo_name").notNull(),
  shippingMethod: text("shipping_method").notNull(),
  shippingAddress: text("shipping_address"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  listingId: integer("listing_id"),
  cardName: text("card_name").notNull(),
  setName: text("set_name").notNull(),
  setCode: text("set_code").notNull(),
  language: text("language").notNull(),
  condition: text("condition").notNull(),
  imageUrl: text("image_url").notNull(),
  number: text("number").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceVnd: integer("unit_price_vnd").notNull(),
});
