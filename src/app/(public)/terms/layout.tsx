import { corePageMetadata } from '@/lib/seo';

export const metadata = corePageMetadata('/terms');

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
