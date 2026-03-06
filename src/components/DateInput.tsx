import React, { useEffect } from 'react';
import { useDateInput } from '../hooks/useDateInput';

interface DateInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  label,
  placeholder = 'dd/mm/aaaa',
  className,
  required,
}) => {
  const { displayValue, dateValue, handleChange, handleBlur } = useDateInput(value);

  useEffect(() => {
    onChange(dateValue);
  }, [dateValue]);

  const inputClass = className || 'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-colors';

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className={inputClass}
          maxLength={10}
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
};

export default DateInput;
