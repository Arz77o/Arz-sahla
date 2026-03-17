export function calculatePriceDZD(
  price_usd: number,
  rate: number = 260,
  commission: number = 0.20
): number {
  return Math.round(Math.round(price_usd * rate) * (1 + commission));
}

export function formatDZD(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' دج';
}

export function formatAdminPreview(
  price_usd: number,
  rate = 260,
  commission = 0.20
): string {
  if (!price_usd || price_usd <= 0) return '—';
  return `سيظهر للعميل بـ: ${formatDZD(
    calculatePriceDZD(price_usd, rate, commission)
  )}`;
}
