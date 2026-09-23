export async function fetchFxRates(): Promise<{ usdVnd: number; jpyVnd: number }> {
  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Không lấy được tỷ giá.");
  const body = (await response.json()) as { rates?: { VND?: number; JPY?: number } };
  const usdVnd = body.rates?.VND;
  const jpyPerUsd = body.rates?.JPY;
  if (!usdVnd || !jpyPerUsd) throw new Error("Tỷ giá thiếu VND hoặc JPY.");
  return { usdVnd, jpyVnd: usdVnd / jpyPerUsd };
}
