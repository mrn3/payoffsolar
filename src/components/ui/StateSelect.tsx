'use client';

import React from 'react';
import { US_STATES } from '@/lib/utils/states';

interface StateSelectProps {
  name: string;
  value: string;
  onChange: (_e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (_e: React.FocusEvent<HTMLSelectElement>) => void;
  className?: string;
  required?: boolean;
  error?: boolean;
}

export default function StateSelect({
  name,
  value,
  onChange,
  onBlur,
  className = '',
  required = false,
  _error = false
}: StateSelectProps) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={className}
      required={required}
    >
      <option value="">Select a state...</option>
      {US_STATES.map((state) => (
        <option key={state.code} value={state.code}>
          {state.name} ({state.code})
        </option>
      ))}
    </select>
  );
}
