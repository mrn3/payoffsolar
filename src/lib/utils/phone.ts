/**
 * Phone number formatting utilities
 */

/**
 * Formats a phone number to US format: (XXX) XXX-XXXX
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

  // If it starts with 1, remove the country code since we're US-only
  let phoneNumbers = numbers;
  if (numbers.length === 11 && numbers.startsWith('1')) {
    phoneNumbers = numbers.substring(1);
  }

  // Limit to 10 digits maximum
  phoneNumbers = phoneNumbers.slice(0, 10);

  // Format based on length
  if (phoneNumbers.length <= 3) {
    return `(${phoneNumbers}`;
  } else if (phoneNumbers.length <= 6) {
    return `(${phoneNumbers.slice(0, 3)}) ${phoneNumbers.slice(3)}`;
  } else {
    return `(${phoneNumbers.slice(0, 3)}) ${phoneNumbers.slice(3, 6)}-${phoneNumbers.slice(6, 10)}`;
  }
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
 * Validates if a phone number has exactly 10 digits
 * @param phone - The phone number to validate
 * @returns True if valid (exactly 10 digits), false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = cleanPhoneNumber(phone);
  return cleaned.length === 10;
}
