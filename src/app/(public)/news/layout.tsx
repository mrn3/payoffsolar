import { corePageMetadata } from '@/lib/seo';

export const metadata = corePageMetadata('/news');

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
