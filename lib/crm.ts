import { getClient } from "@/lib/db";
import { countActiveVouchers, listVouchers, type VoucherRow } from "@/lib/vouchers";
import type { OrderStatus } from "@/lib/store";

export type RevenueDay = { key: string; label: string; revenue: number; orders: number };
export type StatusSlice = { status: OrderStatus; count: number; revenue: number };
export type TopProduct = { name: string; quantity: number; revenue: number };

export type CrmDashboard = {
  revenue30: number;
  orders30: number;
  newCustomers30: number;
  customers: number;
  activeVouchers: number;
  days: RevenueDay[];
  statuses: StatusSlice[];
  topProducts: TopProduct[];
  vouchers: VoucherRow[];
};

export type CustomerSummary = {
  phone: string;
  name: string;
  usernames: string[];
  orderCount: number;
  spent: number;
  lastOrderAt: string;
};

export type AccountOnly = {
  id: number;
  username: string;
  createdAt: string;
};

export type CustomerOrder = {
  id: number;
  code: string;
  status: OrderStatus;
  createdAt: string;
  totalVnd: number;
  discountVnd: number;
  voucherCode: string | null;
};

export type CustomerDetail = CustomerSummary & {
  orders: CustomerOrder[];
};

type OrderFact = {
  status: OrderStatus;
  createdAt: string;
  phone: string;
  subtotal: number;
  discount: number;
};

const STATUS_ORDER: OrderStatus[] = ["new", "confirmed", "done", "cancelled"];

function vnDayKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayLabel(key: string) {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

function net(row: OrderFact) {
  return Math.max(0, row.subtotal - row.discount);
}

function recentDayKeys(count: number, now = new Date()) {
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    keys.push(vnDayKey(new Date(now.getTime() - offset * 24 * 60 * 60 * 1000).toISOString()));
  }
  return keys;
}

export async function crmDashboard(): Promise<CrmDashboard> {
  const client = await getClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [orderResult, topResult, vouchers] = await Promise.all([
    client.execute(
      `SELECT o.status, o.created_at as createdAt, o.zalo_phone as phone,
              COALESCE(o.discount_vnd, 0) as discount,
              COALESCE(SUM(i.quantity * i.unit_price_vnd), 0) as subtotal
       FROM orders o
       LEFT JOIN order_items i ON i.order_id = o.id
       GROUP BY o.id`,
    ),
    client.execute(
      `SELECT i.card_name as name, SUM(i.quantity) as quantity, SUM(i.quantity * i.unit_price_vnd) as revenue
       FROM order_items i
       JOIN orders o ON o.id = i.order_id
       WHERE o.status != 'cancelled'
       GROUP BY i.card_name
       ORDER BY quantity DESC, revenue DESC
       LIMIT 6`,
    ),
    listVouchers(),
  ]);

  const facts: OrderFact[] = orderResult.rows.map((row) => {
    const item = row as unknown as { status: string; createdAt: string; phone: string; discount: number; subtotal: number };
    const status: OrderStatus =
      item.status === "confirmed" || item.status === "done" || item.status === "cancelled" ? item.status : "new";
    return {
      status,
      createdAt: String(item.createdAt),
      phone: String(item.phone),
      subtotal: Number(item.subtotal),
      discount: Number(item.discount),
    };
  });

  const dayKeys = recentDayKeys(14, now);
  const dayMap = new Map<string, RevenueDay>(
    dayKeys.map((key) => [key, { key, label: dayLabel(key), revenue: 0, orders: 0 }]),
  );
  const firstByPhone = new Map<string, string>();
  const statuses = new Map<OrderStatus, StatusSlice>(
    STATUS_ORDER.map((status) => [status, { status, count: 0, revenue: 0 }]),
  );

  let revenue30 = 0;
  let orders30 = 0;
  for (const fact of facts) {
    const slice = statuses.get(fact.status);
    if (slice) {
      slice.count += 1;
      if (fact.status !== "cancelled") slice.revenue += net(fact);
    }
    const previous = firstByPhone.get(fact.phone);
    if (!previous || fact.createdAt < previous) firstByPhone.set(fact.phone, fact.createdAt);
    if (fact.status === "cancelled") continue;
    const payable = net(fact);
    const day = dayMap.get(vnDayKey(fact.createdAt));
    if (day) {
      day.revenue += payable;
      day.orders += 1;
    }
    if (fact.createdAt >= since30) {
      revenue30 += payable;
      orders30 += 1;
    }
  }

  let newCustomers30 = 0;
  for (const first of firstByPhone.values()) {
    if (first >= since30) newCustomers30 += 1;
  }

  return {
    revenue30,
    orders30,
    newCustomers30,
    customers: firstByPhone.size,
    activeVouchers: await countActiveVouchers(nowIso),
    days: dayKeys.map((key) => dayMap.get(key)!),
    statuses: STATUS_ORDER.map((status) => statuses.get(status)!),
    topProducts: topResult.rows.map((row) => {
      const item = row as unknown as { name: string; quantity: number; revenue: number };
      return { name: String(item.name), quantity: Number(item.quantity), revenue: Number(item.revenue) };
    }),
    vouchers: vouchers.slice(0, 5),
  };
}

function mapCustomer(row: Record<string, unknown>): CustomerSummary {
  const usernames = String(row.usernames ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return {
    phone: String(row.phone),
    name: String(row.name ?? ""),
    usernames,
    orderCount: Number(row.orderCount),
    spent: Number(row.spent),
    lastOrderAt: String(row.lastOrderAt),
  };
}

export async function listCustomers(query = ""): Promise<{ buyers: CustomerSummary[]; accounts: AccountOnly[] }> {
  const client = await getClient();
  const [buyers, accounts] = await Promise.all([
    client.execute(
      `SELECT o.zalo_phone as phone,
              (SELECT o2.zalo_name FROM orders o2 WHERE o2.zalo_phone = o.zalo_phone ORDER BY o2.id DESC LIMIT 1) as name,
              COUNT(*) as orderCount,
              SUM(CASE WHEN o.status = 'cancelled' THEN 0 ELSE
                    CASE WHEN COALESCE((SELECT SUM(quantity * unit_price_vnd) FROM order_items WHERE order_id = o.id), 0) > COALESCE(o.discount_vnd, 0)
                      THEN COALESCE((SELECT SUM(quantity * unit_price_vnd) FROM order_items WHERE order_id = o.id), 0) - COALESCE(o.discount_vnd, 0)
                      ELSE 0 END
                  END) as spent,
              MAX(o.created_at) as lastOrderAt,
              GROUP_CONCAT(DISTINCT u.username) as usernames
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       GROUP BY o.zalo_phone
       ORDER BY lastOrderAt DESC`,
    ),
    client.execute(
      `SELECT u.id, u.username, u.created_at as createdAt
       FROM users u
       WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)
       ORDER BY u.id DESC`,
    ),
  ]);
  const needle = query.trim().toLowerCase();
  const buyerRows = buyers.rows
    .map((row) => mapCustomer(row as unknown as Record<string, unknown>))
    .filter((row) => {
      if (!needle) return true;
      return (
        row.name.toLowerCase().includes(needle) ||
        row.phone.toLowerCase().includes(needle) ||
        row.usernames.some((name) => name.toLowerCase().includes(needle))
      );
    });
  const accountRows = accounts.rows
    .map((row) => {
      const item = row as unknown as { id: number; username: string; createdAt: string };
      return { id: Number(item.id), username: String(item.username), createdAt: String(item.createdAt) };
    })
    .filter((row) => !needle || row.username.toLowerCase().includes(needle));
  return { buyers: buyerRows, accounts: accountRows };
}

export async function getCustomer(phone: string): Promise<CustomerDetail | null> {
  const client = await getClient();
  const summary = await client.execute({
    sql: `SELECT o.zalo_phone as phone,
            (SELECT o2.zalo_name FROM orders o2 WHERE o2.zalo_phone = o.zalo_phone ORDER BY o2.id DESC LIMIT 1) as name,
            COUNT(*) as orderCount,
            SUM(CASE WHEN o.status = 'cancelled' THEN 0 ELSE
                  CASE WHEN COALESCE((SELECT SUM(quantity * unit_price_vnd) FROM order_items WHERE order_id = o.id), 0) > COALESCE(o.discount_vnd, 0)
                    THEN COALESCE((SELECT SUM(quantity * unit_price_vnd) FROM order_items WHERE order_id = o.id), 0) - COALESCE(o.discount_vnd, 0)
                    ELSE 0 END
                END) as spent,
            MAX(o.created_at) as lastOrderAt,
            GROUP_CONCAT(DISTINCT u.username) as usernames
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.zalo_phone = ?
     GROUP BY o.zalo_phone`,
    args: [phone],
  });
  const row = summary.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) return null;
  const orders = await client.execute({
    sql: `SELECT o.id, o.code, o.status, o.created_at as createdAt, o.voucher_code as voucherCode,
            COALESCE(o.discount_vnd, 0) as discountVnd,
            CASE WHEN COALESCE(SUM(i.quantity * i.unit_price_vnd), 0) > COALESCE(o.discount_vnd, 0)
              THEN COALESCE(SUM(i.quantity * i.unit_price_vnd), 0) - COALESCE(o.discount_vnd, 0)
              ELSE 0 END as totalVnd
     FROM orders o
     LEFT JOIN order_items i ON i.order_id = o.id
     WHERE o.zalo_phone = ?
     GROUP BY o.id
     ORDER BY o.id DESC`,
    args: [phone],
  });
  return {
    ...mapCustomer(row),
    orders: orders.rows.map((item) => {
      const order = item as unknown as CustomerOrder;
      const status: OrderStatus =
        order.status === "confirmed" || order.status === "done" || order.status === "cancelled" ? order.status : "new";
      return {
        id: Number(order.id),
        code: String(order.code),
        status,
        createdAt: String(order.createdAt),
        totalVnd: Number(order.totalVnd),
        discountVnd: Number(order.discountVnd),
        voucherCode: order.voucherCode ? String(order.voucherCode) : null,
      };
    }),
  };
}
