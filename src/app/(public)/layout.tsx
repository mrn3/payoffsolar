'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaSun, FaBars, FaTimes, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <FaSun className="h-6 w-6 text-green-500" />
              <span className="text-xl font-bold">Payoff Solar</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href) ? 'text-green-500' : 'hover:text-green-500'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
            >
              Login
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-green-50 text-green-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-green-500'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <FaSun className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold">Payoff Solar</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Making your home more energy efficient with premium solar solutions. Save money and the planet.
              </p>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <span className="sr-only">Facebook</span>
                  <FaFacebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <span className="sr-only">Twitter</span>
                  <FaTwitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <span className="sr-only">Instagram</span>
                  <FaInstagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-500">
                  <span className="sr-only">LinkedIn</span>
                  <FaLinkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Products</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/products/solar-panels" className="text-sm text-gray-600 hover:text-green-500">
                    Solar Panels
                  </Link>
                </li>
                <li>
                  <Link href="/products/batteries" className="text-sm text-gray-600 hover:text-green-500">
                    Energy Storage
                  </Link>
                </li>
                <li>
                  <Link href="/products/inverters" className="text-sm text-gray-600 hover:text-green-500">
                    Inverters
                  </Link>
                </li>
                <li>
                  <Link href="/products/mounting-systems" className="text-sm text-gray-600 hover:text-green-500">
                    Mounting Systems
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Services</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/services/installation" className="text-sm text-gray-600 hover:text-green-500">
                    Installation
                  </Link>
                </li>
                <li>
                  <Link href="/services/maintenance" className="text-sm text-gray-600 hover:text-green-500">
                    Maintenance
                  </Link>
                </li>
                <li>
                  <Link href="/services/consultation" className="text-sm text-gray-600 hover:text-green-500">
                    Consultation
                  </Link>
                </li>
                <li>
                  <Link href="/services/system-upgrade" className="text-sm text-gray-600 hover:text-green-500">
                    System Upgrade
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact</h3>
              <ul className="mt-4 space-y-2">
                <li className="text-sm text-gray-600">
                  123 Solar Street, Sunshine City, CA 90210
                </li>
                <li className="text-sm text-gray-600">
                  info@payoffsolar.com
                </li>
                <li className="text-sm text-gray-600">
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
            <p className="text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} Payoff Solar. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
