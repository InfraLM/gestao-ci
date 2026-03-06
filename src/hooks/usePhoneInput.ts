import { useState, ChangeEvent } from 'react';

export const usePhoneInput = (initialValue: string = '') => {
  const [value, setValue] = useState<string>(initialValue);

  /**
   * Formata número de telefone brasileiro
   * (11) 98765-4321 ou (11) 3456-7890
   */
  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 0) return '';

    if (cleaned.length <= 2) {
      return `(${cleaned}`;
    }

    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }

    if (cleaned.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }

    // Celular: (XX) XXXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = input.replace(/\D/g, '');

    // Limita a 11 dígitos
    if (cleaned.length <= 11) {
      const formatted = formatPhone(cleaned);
      setValue(formatted);
    }
  };

  return {
    value,
    handleChange,
    setValue: (newValue: string) => setValue(formatPhone(newValue))
  };
};
