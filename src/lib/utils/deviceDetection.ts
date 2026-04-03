/**
 * Device detection utilities for client-side browser detection
 */

/**
 * Detects if the user is on an Android device
 * @returns true if Android device, false otherwise
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Detects if the user is on an iOS device (iPhone, iPad, iPod)
 * @returns true if iOS device, false otherwise
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Detects if the user is on a mobile device (Android or iOS)
 * @returns true if mobile device, false otherwise
 */
export function isMobile(): boolean {
  return isAndroid() || isIOS();
}

/**
 * Detects if the user is on a desktop device
 * @returns true if desktop, false otherwise
 */
export function isDesktop(): boolean {
  return !isMobile();
}

/**
 * Gets the user agent string
 * @returns user agent string or empty string if window is undefined
 */
export function getUserAgent(): string {
  if (typeof window === 'undefined') return '';
  return navigator.userAgent;
}
