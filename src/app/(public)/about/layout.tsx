import { corePageMetadata } from '@/lib/seo';

export const metadata = corePageMetadata('/about');

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
