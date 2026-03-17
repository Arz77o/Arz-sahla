export function calculatePriceDZD(
  price_usd: number,
  rate: number = 250,
  commission: number = 1.20
): number {
  // Price = (USD * Rate) * Commission Multiplier (e.g. 1.2 for 20% profit)
  const basePrice = price_usd * rate;
  const totalPrice = basePrice * commission;
  
  // Round to nearest 10 for cleaner display (e.g. 3004 -> 3000, 3124 -> 3120)
  // If the user wants 3000 exactly, it will be 3000.
  return Math.round(totalPrice / 10) * 10;
}

export function formatDZD(amount: number): string {
  const isAr = document.documentElement.lang === 'ar';
  const currency = isAr ? ' دج' : ' DZ';
  // Use space as separator
  return amount.toLocaleString('fr-FR').replace(',', '.') + currency;
}

export function formatAdminPreview(
  price_usd: number,
  rate = 250,
  commission = 1.2
): string {
  if (!price_usd || price_usd <= 0) return '—';
  return `سيظهر للعميل بـ: ${formatDZD(
    calculatePriceDZD(price_usd, rate, commission)
  )}`;
}
