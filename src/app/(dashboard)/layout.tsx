'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaSun, FaUsers, FaBoxes, FaShoppingCart, FaFileInvoiceDollar, FaWarehouse, FaEdit, FaTachometerAlt, FaSignOutAlt, FaBars, FaTimes, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name: string | null; last_name: string | null; email: string | null } | null>(null);

  useEffect(() => {
    // TODO: Implement client-side profile loading with MySQL auth
    // For now, we'll handle this server-side
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navItems = [
    { href: '/dashboard', icon: <FaTachometerAlt className="mr-3 h-5 w-5" />, label: 'Dashboard' },
    { href: '/dashboard/customers', icon: <FaUsers className="mr-3 h-5 w-5" />, label: 'Customers' },
    { href: '/dashboard/products', icon: <FaBoxes className="mr-3 h-5 w-5" />, label: 'Products' },
    { href: '/dashboard/orders', icon: <FaShoppingCart className="mr-3 h-5 w-5" />, label: 'Orders' },
    { href: '/dashboard/invoices', icon: <FaFileInvoiceDollar className="mr-3 h-5 w-5" />, label: 'Invoices' },
    { href: '/dashboard/inventory', icon: <FaWarehouse className="mr-3 h-5 w-5" />, label: 'Inventory' },
    { href: '/dashboard/services', icon: <FaCalendarAlt className="mr-3 h-5 w-5" />, label: 'Services' },
    { href: '/dashboard/cms', icon: <FaEdit className="mr-3 h-5 w-5" />, label: 'CMS' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <FaSun className="h-6 w-6 text-green-500 mr-2" />
            <span className="text-xl font-bold">Payoff Solar</span>
          </div>
          <div className="flex flex-col flex-grow px-4 mt-5">
            <nav className="flex-1 space-y-1 bg-white">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={isActive(item.href) ? 'text-green-500' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <FaUser className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Loading...'}
                </p>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <FaSignOutAlt className="mr-1 h-3 w-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
        >
          <span className="sr-only">Open sidebar</span>
          <FaBars className="h-6 w-6" />
        </button>

        {/* Mobile menu panel */}
        <div className={`fixed inset-0 z-40 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Close sidebar</span>
                <FaTimes className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <FaSun className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-xl font-bold">Payoff Solar</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className={isActive(item.href) ? 'text-green-500' : 'text-gray-500'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUser className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Loading...'}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <FaSignOutAlt className="mr-1 h-3 w-3" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-14"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="w-full">
          <div className="relative z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 shadow-sm flex">
            <div className="flex-1 flex justify-between px-4 md:px-0">
              <div className="flex-1 flex md:ml-64">
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8">
                  <h1 className="text-2xl font-semibold text-gray-900 py-4">
                    {pathname === '/dashboard' ? 'Dashboard' :
                     pathname?.startsWith('/dashboard/customers') ? 'Customers' :
                     pathname?.startsWith('/dashboard/products') ? 'Products' :
                     pathname?.startsWith('/dashboard/orders') ? 'Orders' :
                     pathname?.startsWith('/dashboard/invoices') ? 'Invoices' :
                     pathname?.startsWith('/dashboard/inventory') ? 'Inventory' :
                     pathname?.startsWith('/dashboard/services') ? 'Services' :
                     pathname?.startsWith('/dashboard/cms') ? 'Content Management' :
                     'Dashboard'}
                  </h1>
                </div>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                {/* Profile dropdown */}
                <div className="ml-3 relative">
                  <div>
                    <div className="max-w-xs bg-white rounded-full flex items-center text-sm">
                      <span className="sr-only">User menu</span>
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <FaUser className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
