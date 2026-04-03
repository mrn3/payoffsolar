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
 * Detects if the user is in an in-app browser (Facebook, Instagram, etc.)
 * These browsers often show "You're leaving our app" dialogs for external links
 * @returns true if in an in-app browser, false otherwise
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor;

  // Facebook/Instagram in-app browsers
  if (ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1) {
    return true;
  }

  // Instagram in-app browser
  if (ua.indexOf('Instagram') > -1) {
    return true;
  }

  // Twitter in-app browser
  if (ua.indexOf('Twitter') > -1) {
    return true;
  }

  // LinkedIn in-app browser
  if (ua.indexOf('LinkedInApp') > -1) {
    return true;
  }

  // Check for other common in-app browser indicators
  // Some apps use WebView without clear identifiers, but these are the most common
  return false;
}

/**
 * Gets the user agent string
 * @returns user agent string or empty string if window is undefined
 */
export function getUserAgent(): string {
  if (typeof window === 'undefined') return '';
  return navigator.userAgent;
}
