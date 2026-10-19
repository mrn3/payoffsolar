// Retired content slugs and where their visitors should land.
// Checked before the database, so a redirect works whether or not the post still exists.
export const retiredContentRedirects: Record<string, string> = {
  'black-friday-sale': '/news',
  'welcome-to-the-new-website': '/programs',
  'referral-program': '/programs',
  'loyalty-program': '/programs',
};

const PLACEHOLDER_TEXT = /^enter your text here\.{0,3}$/i;

export function isPlaceholderHtml(html: string | undefined | null) {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return PLACEHOLDER_TEXT.test(text);
}
