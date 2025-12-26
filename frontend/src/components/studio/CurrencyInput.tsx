import { Input } from '@/components/ui/input';
import { formatCurrencyInput } from '@/utils/currencyFormat';
import type { CurrencyType } from './StudioEditor';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  currency: CurrencyType;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({ value, onChange, currency, placeholder, className }: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatCurrencyInput(rawValue, currency);
    onChange(formatted);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={20}
    />
  );
}
