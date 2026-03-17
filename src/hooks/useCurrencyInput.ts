import { useState, ChangeEvent, useEffect } from 'react';

/**
 * Hook para formatação de valores monetários em inputs
 * Funciona como máscara: últimos 2 dígitos sempre após a vírgula
 */
export const useCurrencyInput = (initialValue: number = 0) => {
  const [value, setValue] = useState<number>(initialValue);
  const [displayValue, setDisplayValue] = useState<string>(formatFromCents(Math.round(initialValue * 100)));

  useEffect(() => {
    setValue(initialValue);
    setDisplayValue(formatFromCents(Math.round(initialValue * 100)));
  }, [initialValue]);

  function formatFromCents(cents: number): string {
    if (cents === 0) return '0,00';
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const cents = parseInt(digits, 10) || 0;
    const numValue = cents / 100;

    setValue(numValue);
    setDisplayValue(formatFromCents(cents));
  };

  const handleFocus = () => {};
  const handleBlur = () => {};

  const reset = (newValue: number = 0) => {
    setValue(newValue);
    setDisplayValue(formatFromCents(Math.round(newValue * 100)));
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
      setDisplayValue(formatFromCents(Math.round(newValue * 100)));
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
