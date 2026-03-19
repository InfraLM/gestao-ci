import React from 'react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Componente de input para valores monetários
 * Formata automaticamente para o padrão brasileiro com 2 casas decimais
 */
const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  disabled = false,
  required = false
}) => {
  const { displayValue, handleChange, handleFocus, handleBlur, value: internalValue } = useCurrencyInput(value);

  const prevInternalRef = React.useRef(internalValue);
  React.useEffect(() => {
    // Notifica mudanças apenas quando realmente houve diferença significativa (evita loops de float)
    if (Math.abs(internalValue - prevInternalRef.current) >= 0.005) {
      prevInternalRef.current = internalValue;
      onChange(internalValue);
    }
  }, [internalValue, onChange]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          R$
        </span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-teal focus:border-brand-teal disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default CurrencyInput;
