'use client';

import React from 'react';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/utils/phone';

interface PhoneInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}

export default function PhoneInput({
  name,
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = '(555) 123-4567',
  required = false,
  error = false
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatPhoneNumber(inputValue);

    // Create a new event with the formatted value
    const formattedEvent = {
      ...e,
      target: {
        ...e.target,
        value: formattedValue,
        name: name
      }
    };

    onChange(formattedEvent as React.ChangeEvent<HTMLInputElement>);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Call the parent's onBlur handler if provided
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      type="tel"
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      required={required}
      maxLength={14} // (XXX) XXX-XXXX = 14 characters
    />
  );
}
