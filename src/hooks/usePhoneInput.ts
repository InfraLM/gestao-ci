import { useState, ChangeEvent, useCallback, useRef, useEffect } from 'react';

/**
 * Formata número de telefone brasileiro para exibição
 * (11) 98765-4321 ou (11) 3456-7890
 */
function formatPhone(digits: string): string {
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Extrai apenas dígitos de uma string
 */
function extractDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

/**
 * Hook para input de telefone brasileiro.
 * - `displayValue`: valor formatado para exibir no input
 * - `rawValue`: apenas dígitos, para guardar no state do form/enviar ao backend
 * - `handleChange`: handler para o input onChange
 */
export const usePhoneInput = (externalValue: string = '') => {
  const digits = extractDigits(externalValue);
  const [rawValue, setRawValue] = useState<string>(digits);
  const [displayValue, setDisplayValue] = useState<string>(formatPhone(digits));
  const prevExternalRef = useRef(digits);

  // Sincronizar quando o valor externo muda (ex: ao abrir modal com dados do aluno)
  useEffect(() => {
    const newDigits = extractDigits(externalValue);
    if (newDigits !== prevExternalRef.current) {
      prevExternalRef.current = newDigits;
      setRawValue(newDigits);
      setDisplayValue(formatPhone(newDigits));
    }
  }, [externalValue]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = extractDigits(input);
    setRawValue(cleaned);
    setDisplayValue(formatPhone(cleaned));
  }, []);

  return {
    displayValue,
    rawValue,
    handleChange,
  };
};
