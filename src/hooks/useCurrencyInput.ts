import { useState, ChangeEvent, useEffect } from 'react';

/**
 * Hook para formatação de valores monetários em inputs
 * Otimizado para não travar durante digitação
 */
export const useCurrencyInput = (initialValue: number = 0) => {
  const [value, setValue] = useState<number>(initialValue);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatToBRL(initialValue));
      setValue(initialValue);
    }
  }, [initialValue, isFocused]);

  /**
   * Formata número para formato brasileiro (1234.56 -> "1.234,56")
   */
  function formatToBRL(num: number): string {
    if (num === 0) return '';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Converte formato brasileiro para número ("1234,56" -> 1234.56)
   */
  function parseBRL(str: string): number {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d,]/g, '');
    const withDot = cleaned.replace(',', '.');
    const num = parseFloat(withDot) || 0;
    return Math.round(num * 100) / 100;
  }

  /**
   * Handler para mudanças no input - SEM formatação durante digitação
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove tudo exceto dígitos e vírgula
    input = input.replace(/[^\d,]/g, '');

    // Permite apenas uma vírgula
    const parts = input.split(',');
    if (parts.length > 2) {
      input = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limita a 2 casas decimais após a vírgula
    if (parts.length === 2 && parts[1].length > 2) {
      input = parts[0] + ',' + parts[1].slice(0, 2);
    }

    setDisplayValue(input);
    const numValue = parseBRL(input);
    setValue(numValue);
  };

  /**
   * Handler para quando o input ganha foco
   */
  const handleFocus = () => {
    setIsFocused(true);
    // Remove formatação ao focar
    if (value === 0) {
      setDisplayValue('');
    } else {
      const rawValue = value.toString().replace('.', ',');
      setDisplayValue(rawValue);
    }
  };

  /**
   * Handler para quando o input perde o foco (formatação final)
   */
  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatToBRL(value));
  };

  /**
   * Reseta o valor
   */
  const reset = (newValue: number = 0) => {
    setValue(newValue);
    setDisplayValue(formatToBRL(newValue));
  };

  return {
    value,
    displayValue,
    handleChange,
    handleFocus,
    handleBlur,
    reset,
    setValue: (newValue: number) => {
      setValue(newValue);
      if (!isFocused) {
        setDisplayValue(formatToBRL(newValue));
      }
    }
  };
};

/**
 * Formata número para exibição em real brasileiro
 */
export const formatCurrency = (value: number): string => {
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Formata número sem símbolo
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
