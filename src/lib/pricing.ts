

export function formatDZD(amount: number | null | undefined): string {
  // Guard: if amount is nullish or not a valid number, return a safe fallback
  if (amount == null || isNaN(amount)) return '—';

  const isAr = document.documentElement.lang === 'ar';
  const currency = isAr ? ' دج' : ' DZ';
  // Use space as separator
  return amount.toLocaleString('fr-FR').replace(',', '.') + currency;
}


