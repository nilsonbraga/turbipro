import type { CurrencyType } from '@/components/studio/StudioEditor';

/**
 * Format currency value while typing based on currency type
 * BRL: 1.234,56 (dot for thousands, comma for decimals)
 * EUR/USD: 1,234.56 (comma for thousands, dot for decimals)
 */
export function formatCurrencyInput(value: string, currency: CurrencyType = 'BRL'): string {
  const decimalSep = currency === 'BRL' ? ',' : '.';
  const thousandSep = currency === 'BRL' ? '.' : ',';
  
  // Allow only digits and the correct decimal separator
  let cleaned = value.replace(new RegExp(`[^0-9${decimalSep === ',' ? ',' : '\\.'}]`, 'g'), '');
  
  // Ensure only one decimal separator
  const parts = cleaned.split(decimalSep);
  if (parts.length > 2) {
    cleaned = parts[0] + decimalSep + parts.slice(1).join('');
  }
  
  // Split into integer and decimal parts
  const [intPart, decPart] = cleaned.split(decimalSep);
  
  if (!intPart && !decPart) return '';
  
  // Remove leading zeros from integer part (but keep at least one zero)
  let intCleaned = (intPart || '').replace(/^0+/, '') || '';
  
  // Add thousand separators to integer part
  const intFormatted = intCleaned.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  
  // Limit decimal to 2 places
  const decLimited = decPart !== undefined ? decPart.slice(0, 2) : undefined;
  
  // Combine parts
  if (decLimited !== undefined) {
    return intFormatted + decimalSep + decLimited;
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
