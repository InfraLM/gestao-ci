import React from 'react';
import { usePhoneInput } from '../hooks/usePhoneInput';

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "(00) 00000-0000",
  className = "",
  disabled = false,
  required = false
}) => {
  const { value: internalValue, handleChange } = usePhoneInput(value);

  React.useEffect(() => {
    if (internalValue !== value) {
      onChange(internalValue);
    }
  }, [internalValue]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="tel"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-teal focus:border-brand-teal disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default PhoneInput;
