import type { CurrencyType } from '@/components/studio/StudioEditor';

/**
 * Format currency value while typing based on currency type
 * BRL: 1.234,56 (dot for thousands, comma for decimals)
 * EUR/USD: 1,234.56 (comma for thousands, dot for decimals)
 */
export function formatCurrencyInput(value: string, currency: CurrencyType = 'BRL'): string {
  const decimalSep = currency === 'BRL' ? ',' : '.';
  const thousandSep = currency === 'BRL' ? '.' : ',';

  const cleaned = value.replace(/[^\d.,]/g, '');
  if (!cleaned) return '';

  const normalized = decimalSep === ',' ? cleaned.replace(/\./g, '') : cleaned.replace(/,/g, '');
  const hasDecimal = normalized.includes(decimalSep);
  const parts = normalized.split(decimalSep);
  const intPartRaw = parts[0].replace(/\D/g, '');
  const decPartRaw = parts.slice(1).join('').replace(/\D/g, '');

  const intCleaned = intPartRaw.replace(/^0+/, '') || '0';
  const intFormatted = intCleaned.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  if (hasDecimal) {
    if (!decPartRaw) return intFormatted + decimalSep;
    return intFormatted + decimalSep + decPartRaw.slice(0, 2);
  }

  return intFormatted;
}

/**
 * Parse formatted currency string back to raw number string (returns decimal number as string)
 */
export function parseCurrencyInput(value: string, currency: CurrencyType = 'BRL'): string {
  if (!value) return '';
  
  if (currency === 'BRL') {
    // Remove thousand separators (dots), replace decimal comma with dot
    return value.replace(/\./g, '').replace(',', '.');
  } else {
    // Remove thousand separators (commas)
    return value.replace(/,/g, '');
  }
}
