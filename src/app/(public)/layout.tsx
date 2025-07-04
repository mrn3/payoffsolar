import React from 'react';
import Link from 'next/link';
import { getUserProfile } from '@/lib/auth';
import PublicHeader from '@/components/PublicHeader';
import { CartProvider } from '@/contexts/CartContext';
import CartSidebar from '@/components/cart/CartSidebar';
import { FaFacebook, FaInstagram, FaLinkedin, FaSun, FaTwitter } from 'react-icons/fa';

// Force dynamic rendering for public pages that use cookies
export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user profile server-side
  let userProfile = null;
  try {
    userProfile = await getUserProfile();
  } catch (_error) {
    console.error('Error loading user profile:', _error);
  }

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <PublicHeader userProfile={userProfile} />

        <main className="flex-1">{children}</main>

        {/* Cart Sidebar */}
        <CartSidebar />

      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <FaSun className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold text-gray-900">Payoff Solar</span>
              </div>
              <p className="mt-4 text-sm text-gray-700">
                Making your home more energy efficient with premium solar solutions. Save money and the planet.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-green-500">
                  <span className="sr-only">Facebook</span>
                  <FaFacebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-green-500">
                  <span className="sr-only">Twitter</span>
                  <FaTwitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-green-500">
                  <span className="sr-only">Instagram</span>
                  <FaInstagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-green-500">
                  <span className="sr-only">LinkedIn</span>
                  <FaLinkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Products</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/products/category/solar-panels" className="text-sm text-gray-700 hover:text-green-500">
                    Solar Panels
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/batteries" className="text-sm text-gray-700 hover:text-green-500">
                    Energy Storage
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/inverters" className="text-sm text-gray-700 hover:text-green-500">
                    Inverters
                  </Link>
                </li>
                <li>
                  <Link href="/products/category/mounting-systems" className="text-sm text-gray-700 hover:text-green-500">
                    Mounting Systems
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Pricing</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/pricing" className="text-sm text-gray-700 hover:text-green-500">
                    Installation Packages
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#small" className="text-sm text-gray-700 hover:text-green-500">
                    Small Package
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#medium" className="text-sm text-gray-700 hover:text-green-500">
                    Medium Package
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#large" className="text-sm text-gray-700 hover:text-green-500">
                    Large Package
                  </Link>
                </li>
                <li>
                  <Link href="/pricing#extra-large" className="text-sm text-gray-700 hover:text-green-500">
                    Extra Large Package
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact</h3>
              <ul className="mt-4 space-y-2">
                <li className="text-sm text-gray-700">
                  11483 S Wexford Way, South Jordan, UT 84009
                </li>
                <li className="text-sm text-gray-700">
                  matt@payoffsolar.com
                </li>
                <li className="text-sm text-gray-700">
                  (801) 448-6396
                </li>
                <li className="mt-4">
                  <Link
                    href="/contact"
                    className="text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Contact Us →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-gray-600 text-center sm:text-left mb-4 sm:mb-0">
                © {new Date().getFullYear()} Payoff Solar. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-green-500">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-green-500">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </CartProvider>
  );
}
