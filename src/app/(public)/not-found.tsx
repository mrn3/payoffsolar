import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="mb-4 text-3xl font-bold">Page Not Found</h1>
      <p className="mb-6 text-gray-600">This page or product is no longer available. Browse our current solar equipment or contact us for help finding an alternative.</p>
      <Link href="/products" className="font-semibold text-green-700">Browse current products</Link>
      <span className="mx-3">|</span>
      <Link href="/contact" className="font-semibold text-green-700">Contact us</Link>
    </div>
  );
}
