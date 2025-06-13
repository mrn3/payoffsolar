/**
 * Phone number formatting utilities
 */

/**
 * Formats a phone number to US format: (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX
 * @param value - The input phone number string
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Handle different input lengths
  if (numbers.length === 0) {
    return '';
  }

  // Check if it starts with 1 (US country code)
  let phoneNumbers = numbers;
  let hasCountryCode = false;

  if (numbers.length === 11 && numbers.startsWith('1')) {
    hasCountryCode = true;
    phoneNumbers = numbers.substring(1);
  } else if (numbers.length <= 10) {
    phoneNumbers = numbers.slice(0, 10);
  } else {
    // If more than 11 digits, limit to 11 and check if starts with 1
    const limited = numbers.slice(0, 11);
    if (limited.startsWith('1')) {
      hasCountryCode = true;
      phoneNumbers = limited.substring(1);
    } else {
      phoneNumbers = numbers.slice(0, 10);
    }
  }

  // Format based on length
  let formatted = '';
  if (phoneNumbers.length <= 3) {
    formatted = `(${phoneNumbers}`;
  } else if (phoneNumbers.length <= 6) {
    formatted = `(${phoneNumbers.slice(0, 3)}) ${phoneNumbers.slice(3)}`;
  } else {
    formatted = `(${phoneNumbers.slice(0, 3)}) ${phoneNumbers.slice(3, 6)}-${phoneNumbers.slice(6, 10)}`;
  }

  // Add country code if present
  return hasCountryCode ? `+1 ${formatted}` : formatted;
}

/**
 * Extracts just the numeric digits from a formatted phone number
 * @param formattedPhone - The formatted phone number string
 * @returns Clean numeric string
 */
export function cleanPhoneNumber(formattedPhone: string): string {
  return formattedPhone.replace(/\D/g, '');
}

/**
 * Validates if a phone number has exactly 10 digits or 11 digits starting with 1 (US country code)
 * @param phone - The phone number to validate
 * @returns True if valid (10 digits or 11 digits starting with 1), false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
}
