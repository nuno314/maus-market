"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { syncCatalog } from "@/lib/catalog";
import { fetchFxRates } from "@/lib/fx";
import { priceFromManualSource, quoteCard } from "@/lib/pricing";
import { SESSION_COOKIE, credentialsMatch, readSession, signSession } from "@/lib/session";
import { findSet, hasSeason, type Condition } from "@/lib/sets";
import { UploadError, saveUploadedImage } from "@/lib/uploads";
import {
  deleteListing,
  getCard,
  getListing,
  getSettings,
  insertManualCard,
  listAllListings,
  saveListing,
  saveSettings,
  setOrderStatus,
  updateListingPrice,
  updateListingQuantity,
  type OrderStatus,
} from "@/lib/store";
import {
  isValidName,
  parseCategory,
  parseCondition,
  parseHttpUrl,
  parseMoney,
  parseQuantity,
  parseVnd,
} from "@/lib/validate";

export type ActionState = { error?: string; ok?: string } | null;

async function requireAdmin() {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
}

function refreshShop() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!credentialsMatch(username, password)) {
    return { error: "Sai tên đăng nhập hoặc mật khẩu." };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function syncCatalogAction() {
  await requireAdmin();
  const report = await syncCatalog();
  refreshShop();
  const skip = report.skipped.map((item) => item.code).join(",");
  redirect(`/admin?synced=${report.added}&skip=${encodeURIComponent(skip)}`);
}

export async function createListingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const card = await getCard(String(formData.get("cardId") ?? ""));
  const condition = parseCondition(formData.get("condition"));
  const quantity = parseQuantity(formData.get("quantity"));
  if (!card || !condition || quantity === null || quantity < 1) {
    return { error: "Chọn lá, condition và số lượng lớn hơn 0." };
  }
  const priced = await resolvePrice(card.language, condition, formData, () => quoteCard(card, condition));
  if ("error" in priced) return priced;
  try {
    await saveListing({
      cardId: card.id,
      condition,
      quantity,
      ...priced,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE") {
      return { error: `Lá này đã có condition ${condition}. Sửa số lượng ở danh sách bên dưới.` };
    }
    return { error: "Không lưu được listing." };
  }
  refreshShop();
  redirect("/admin?listed=1");
}

export async function createManualListingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const set = findSet(String(formData.get("setId") ?? ""));
  const category = parseCategory(formData.get("category"));
  const condition = category && category !== "card" ? "A" : parseCondition(formData.get("condition"));
  const quantity = parseQuantity(formData.get("quantity"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceVnd = parseVnd(formData.get("priceVnd"));
  const number = category === "card" ? String(formData.get("number") ?? "").trim() : "";
  const uploaded = formData.get("image");
  let imageUrl: string | null = null;
  if (uploaded instanceof File && uploaded.size > 0) {
    try {
      imageUrl = await saveUploadedImage(uploaded);
    } catch (error) {
      if (error instanceof UploadError) return { error: error.message };
      throw error;
    }
    if (!imageUrl) return { error: "Ảnh cần là JPG, PNG, WEBP hoặc GIF, tối đa 5 MB." };
  } else {
    imageUrl = parseHttpUrl(String(formData.get("imageUrl") ?? ""));
  }
  const seasonal = category ? hasSeason(category) : true;
  if (!category || !condition || quantity === null || quantity < 1 || (seasonal && !set)) {
    return { error: seasonal ? "Điền đủ mùa, loại sản phẩm và số lượng." : "Điền đủ loại sản phẩm và số lượng." };
  }
  if (!isValidName(name) || (category === "card" && (!number || number.length > 12))) {
    return { error: category === "card" ? "Tên lá và số thẻ chưa hợp lệ." : "Tên sản phẩm chưa hợp lệ." };
  }
  if (description.length > 400) return { error: "Mô tả tối đa 400 ký tự." };
  if (!imageUrl) {
    return { error: "Chọn file ảnh hoặc dán link ảnh http/https." };
  }
  if (!priceVnd) return { error: "Giá bán VND cần từ 1.000 đến 100.000.000." };
  const card = await insertManualCard({
    language: set?.language ?? "en",
    setId: set ? (set.tcgdexId ?? set.seasonKey) : "",
    setName: set?.name ?? "",
    setCode: set?.code ?? "",
    seasonKey: set?.seasonKey ?? "",
    number,
    name,
    imageUrl,
    category,
    description,
  });
  try {
    await saveListing({
      cardId: card.id,
      condition,
      quantity,
      sourcePrice: priceVnd,
      sourceCurrency: "VND",
      sourceUrl: null,
      sourceLabel: "Giá nhập tay",
      conditionPriced: true,
      priceVnd,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE") {
      return { error: "Listing condition này đã tồn tại." };
    }
    return { error: "Không lưu được listing." };
  }
  refreshShop();
  redirect("/admin?listed=1");
}

async function resolvePrice(
  language: "en" | "ja",
  condition: Condition,
  formData: FormData,
  quote: () => ReturnType<typeof quoteCard>,
): Promise<
  | {
      sourcePrice: number;
      sourceCurrency: "USD" | "JPY";
      sourceUrl: string | null;
      sourceLabel: string;
      conditionPriced: boolean;
      priceVnd: number;
    }
  | { error: string }
> {
  const manual = parseMoney(formData.get("sourcePrice"));
  const currency = language === "en" ? "USD" : "JPY";
  const conditionPriced = String(formData.get("conditionPriced") ?? "") === "1";
  const sourceUrlRaw = String(formData.get("sourceUrl") ?? "").trim();
  const sourceUrl = sourceUrlRaw ? sourceUrlRaw : null;
  if (manual) {
    const priceVnd = await priceFromManualSource({
      sourcePrice: manual,
      currency,
      condition,
      conditionPriced,
    });
    if (priceVnd <= 0) return { error: "Giá VND tính ra bằng 0. Kiểm tra tỷ giá." };
    return {
      sourcePrice: manual,
      sourceCurrency: currency,
      sourceUrl,
      sourceLabel: String(formData.get("sourceLabel") ?? "") || "Nhập tay",
      conditionPriced,
      priceVnd,
    };
  }
  const live = await quote();
  if (!live.ok) return { error: live.message };
  return {
    sourcePrice: live.sourcePrice,
    sourceCurrency: live.sourceCurrency,
    sourceUrl: live.sourceUrl,
    sourceLabel: live.sourceLabel,
    conditionPriced: live.conditionPriced,
    priceVnd: live.priceVnd,
  };
}

export async function updateQuantityAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const quantity = parseQuantity(formData.get("quantity"));
  if (!Number.isInteger(id) || quantity === null) return;
  await updateListingQuantity(id, quantity);
  refreshShop();
}

export async function deleteListingAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await deleteListing(id);
  refreshShop();
}

export async function refreshListingAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const listing = await getListing(id);
  if (!listing) return;
  const card = await getCard(listing.cardId);
  if (!card) return;
  if (listing.sourceCurrency === "VND" || card.category !== "card") {
    redirect("/admin?priceError=" + encodeURIComponent("Sản phẩm giá nhập tay không lấy giá market."));
  }
  const quote = await quoteCard(card, listing.condition);
  if (!quote.ok) {
    redirect(`/admin?priceError=${encodeURIComponent(quote.message)}`);
  }
  await updateListingPrice(id, quote);
  refreshShop();
  redirect("/admin?priced=1");
}

export async function refreshAllPricesAction() {
  await requireAdmin();
  const rows = await listAllListings();
  let updated = 0;
  let failed = 0;
  for (const row of rows) {
    const card = await getCard(row.cardId);
    if (!card || card.category !== "card" || row.sourceCurrency === "VND") {
      if (!card) failed += 1;
      continue;
    }
    const quote = await quoteCard(card, row.condition);
    if (!quote.ok) {
      failed += 1;
      continue;
    }
    await updateListingPrice(row.id, quote);
    updated += 1;
  }
  refreshShop();
  redirect(`/admin?priced=${updated}&priceFailed=${failed}`);
}

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const current = await getSettings();
  const usdVnd = Number(formData.get("usdVnd"));
  const jpyVnd = Number(formData.get("jpyVnd"));
  const markupPercent = Number(formData.get("markupPercent"));
  const factorA = Number(formData.get("factorA"));
  const factorAMinus = Number(formData.get("factorAMinus"));
  const factorB = Number(formData.get("factorB"));
  if (![usdVnd, jpyVnd, markupPercent, factorA, factorAMinus, factorB].every(Number.isFinite)) {
    return { error: "Các ô tỷ giá phải là số." };
  }
  if (usdVnd <= 0 || jpyVnd <= 0) return { error: "Tỷ giá phải lớn hơn 0." };
  if (markupPercent < 0 || markupPercent > 300) return { error: "Phần trăm lời từ 0 đến 300." };
  if ([factorA, factorAMinus, factorB].some((factor) => factor <= 0 || factor > 2)) {
    return { error: "Hệ số condition phải trong khoảng 0 đến 2." };
  }
  await saveSettings({
    ...current,
    usdVnd,
    jpyVnd,
    markupPercent,
    factorA,
    factorAMinus,
    factorB,
  });
  revalidatePath("/admin/settings");
  return { ok: "Đã lưu tỷ giá và hệ số. Listing mới sẽ dùng số này. Bấm cập nhật giá ở Kho nếu muốn tính lại listing đang bán." };
}

export async function refreshFxAction(): Promise<void> {
  await requireAdmin();
  const rates = await fetchFxRates();
  const current = await getSettings();
  await saveSettings({ ...current, usdVnd: rates.usdVnd, jpyVnd: rates.jpyVnd });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?fx=1");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!Number.isInteger(id)) return;
  if (!["new", "confirmed", "done", "cancelled"].includes(status)) return;
  await setOrderStatus(id, status);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/");
}
