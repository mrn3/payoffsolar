'use client';

import React from 'react';
import {formatPhoneNumber} from '@/lib/utils/phone';

interface PhoneInputProps {
  name: string;
  value: string;
  onChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (_e: React.FocusEvent<HTMLInputElement>) => void;
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
  placeholder = '+1 (555) 123-4567',
  required = false,
  _error = false
}: PhoneInputProps) {
  const handleChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    // Call the parent&apos;s onBlur handler if provided
    if (onBlur) {
      onBlur(_e);
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
      maxLength={17} // +1 (XXX) XXX-XXXX = 17 characters
    />
  );
}
