/**
 * Strips HTML tags from a string and returns plain text
 * @param html - HTML string to strip tags from
 * @returns Plain text string
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags using regex
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text - Text to truncate
 * @param maxLength - Maximum length of the text
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Strips HTML tags and truncates text for preview purposes
 * @param html - HTML string to process
 * @param maxLength - Maximum length of the preview text
 * @returns Plain text preview
 */
export function createTextPreview(html: string, maxLength: number = 150): string {
  const plainText = stripHtmlTags(html);
  return truncateText(plainText, maxLength);
}
