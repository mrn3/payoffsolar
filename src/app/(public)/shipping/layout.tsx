import { corePageMetadata } from '@/lib/seo';

export const metadata = corePageMetadata('/shipping');

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
