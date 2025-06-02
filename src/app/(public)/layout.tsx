import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { getUserProfile } from '@/lib/auth';
import PublicHeader from '@/components/PublicHeader';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user profile server-side
  let userProfile = null;
  try {
    userProfile = await getUserProfile();
  } catch (error) {
    console.error('Error loading user profile:', error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader userProfile={userProfile} />

      <main className="flex-1">{children}</main>

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
                  <Link href="/products/solar-panels" className="text-sm text-gray-700 hover:text-green-500">
                    Solar Panels
                  </Link>
                </li>
                <li>
                  <Link href="/products/batteries" className="text-sm text-gray-700 hover:text-green-500">
                    Energy Storage
                  </Link>
                </li>
                <li>
                  <Link href="/products/inverters" className="text-sm text-gray-700 hover:text-green-500">
                    Inverters
                  </Link>
                </li>
                <li>
                  <Link href="/products/mounting-systems" className="text-sm text-gray-700 hover:text-green-500">
                    Mounting Systems
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Services</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/services/installation" className="text-sm text-gray-700 hover:text-green-500">
                    Installation
                  </Link>
                </li>
                <li>
                  <Link href="/services/maintenance" className="text-sm text-gray-700 hover:text-green-500">
                    Maintenance
                  </Link>
                </li>
                <li>
                  <Link href="/services/consultation" className="text-sm text-gray-700 hover:text-green-500">
                    Consultation
                  </Link>
                </li>
                <li>
                  <Link href="/services/system-upgrade" className="text-sm text-gray-700 hover:text-green-500">
                    System Upgrade
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact</h3>
              <ul className="mt-4 space-y-2">
                <li className="text-sm text-gray-700">
                  123 Solar Street, Sunshine City, CA 90210
                </li>
                <li className="text-sm text-gray-700">
                  info@payoffsolar.com
                </li>
                <li className="text-sm text-gray-700">
                  (555) 123-4567
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
            <p className="text-sm text-gray-600 text-center">
              © {new Date().getFullYear()} Payoff Solar. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
