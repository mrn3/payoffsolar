/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Generates a URL-friendly slug from a given text
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading and trailing hyphens
    .trim();
}

/**
 * Generates a unique slug for a product based on name and SKU
 * @param name - Product name
 * @param sku - Product SKU
 * @returns A unique slug combining name and SKU
 */
export function generateProductSlug(name: string, sku: string): string {
  if (!name && !sku) return '';
  
  const nameSlug = generateSlug(name);
  const skuSlug = generateSlug(sku);
  
  // Combine name and SKU for uniqueness
  if (nameSlug && skuSlug) {
    return `${nameSlug}-${skuSlug}`;
  } else if (nameSlug) {
    return nameSlug;
  } else {
    return skuSlug;
  }
}

/**
 * Validates if a slug is properly formatted
 * @param slug - The slug to validate
 * @returns True if the slug is valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  
  // Check if slug contains only lowercase letters, numbers, and hyphens
  // Must not start or end with hyphen
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Sanitizes a slug to ensure it's valid
 * @param slug - The slug to sanitize
 * @returns A sanitized, valid slug
 */
export function sanitizeSlug(slug: string): string {
  return generateSlug(slug);
}
