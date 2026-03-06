import { useState, useEffect, ChangeEvent } from 'react';

/**
 * Hook para mascara de data dd/mm/aaaa em inputs de texto.
 * Auto-insere barras conforme o usuario digita.
 */
export const useDateInput = (initialValue: Date | null = null) => {
  const [dateValue, setDateValue] = useState<Date | null>(initialValue);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (initialValue) {
      setDisplayValue(formatDateDisplay(initialValue));
      setDateValue(initialValue);
    } else {
      setDisplayValue('');
      setDateValue(null);
    }
  }, [initialValue]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 8) raw = raw.slice(0, 8);

    let formatted = '';
    if (raw.length > 0) formatted = raw.slice(0, 2);
    if (raw.length > 2) formatted += '/' + raw.slice(2, 4);
    if (raw.length > 4) formatted += '/' + raw.slice(4, 8);

    setDisplayValue(formatted);

    if (raw.length === 8) {
      const day = parseInt(raw.slice(0, 2), 10);
      const month = parseInt(raw.slice(2, 4), 10);
      const year = parseInt(raw.slice(4, 8), 10);

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (date.getDate() === day && date.getMonth() === month - 1) {
          setDateValue(date);
          return;
        }
      }
    }
    if (raw.length < 8) {
      setDateValue(null);
    }
  };

  const handleBlur = () => {
    if (displayValue && !dateValue) {
      // Data incompleta ou invalida — limpar
      setDisplayValue('');
    }
  };

  const reset = (newDate: Date | null = null) => {
    setDateValue(newDate);
    setDisplayValue(newDate ? formatDateDisplay(newDate) : '');
  };

  return { dateValue, displayValue, handleChange, handleBlur, reset };
};

function formatDateDisplay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear());
  return `${d}/${m}/${y}`;
}
