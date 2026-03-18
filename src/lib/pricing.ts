export function calculatePriceDZD(
  price_usd: number,
  rate: number = 250,
  commission: number = 1.20,
  price_dzd?: number // New: Direct DZD price
): number {
  // If direct DZD price is provided and > 0, use it
  if (price_dzd && price_dzd > 0) {
    return price_dzd;
  }

  // Fallback: Price = (USD * Rate) * Commission Multiplier (e.g. 1.2 for 20% profit)
  const basePrice = price_usd * rate;
  const totalPrice = basePrice * commission;
  
  // Round to nearest 10 for cleaner display
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
  commission = 1.2,
  price_dzd?: number
): string {
  const finalPrice = calculatePriceDZD(price_usd, rate, commission, price_dzd);
  if (finalPrice <= 0) return '—';
  return `سيظهر للعميل بـ: ${formatDZD(finalPrice)}`;
}
