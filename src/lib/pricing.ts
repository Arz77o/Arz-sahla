export function calculatePriceDZD(
  cost_dzd: number, // Formerly price_usd, now stores cost in DZD
  rate: number = 1, // Default rate is 1 since cost is already in DZD
  commission: number = 1.20,
  price_dzd?: number // Direct selling price in DZD
): number {
  // If direct DZD price is provided and > 0, use it
  if (price_dzd && price_dzd > 0) {
    return price_dzd;
  }

  // Fallback: Price = (Cost * Rate) * Commission Multiplier (e.g. 1.2 for 20% profit)
  const basePrice = cost_dzd * rate;
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
  cost_dzd: number,
  rate = 1,
  commission = 1.2,
  price_dzd?: number
): string {
  const finalPrice = calculatePriceDZD(cost_dzd, rate, commission, price_dzd);
  if (finalPrice <= 0) return '—';
  return `سيظهر للعميل بـ: ${formatDZD(finalPrice)}`;
}
