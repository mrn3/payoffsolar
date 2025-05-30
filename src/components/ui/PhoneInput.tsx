'use client';

import React from 'react';
import { formatPhoneNumber } from '@/lib/utils/phone';

interface PhoneInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}

export default function PhoneInput({
  name,
  value,
  onChange,
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

  return (
    <input
      type="tel"
      name={name}
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      required={required}
      maxLength={14} // (XXX) XXX-XXXX = 14 characters
    />
  );
}
