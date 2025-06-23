'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@/lib/auth';
import {FaTachometerAlt, FaShoppingCart, FaUsers, FaBoxes, FaWarehouse, FaBuilding, FaSun, FaUser, FaSignOutAlt, FaBars, FaTimes, FaEdit, FaTags, FaLayerGroup, FaTasks} from 'react-icons/fa';

interface NavigationProps {
  userProfile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: UserRole | null;
  } | null;
}

export default function DashboardNavigation({ userProfile }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const _response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (_response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (_error) {
      console.error('Error signing out:', _error);
    }
  };

  const isActive = (path: string) => {
    // Special case for Dashboard - only active when exactly on /dashboard
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    // For other routes, check exact match or if it&apos;s a sub-route
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { href: '/dashboard', icon: <FaTachometerAlt className="mr-3 h-5 w-5" />, label: 'Dashboard' },
    ];

    // Contact users only see orders
    if (userProfile?.role === 'contact') {
      return [
        ...baseItems,
        { href: '/dashboard/orders', icon: <FaShoppingCart className="mr-3 h-5 w-5" />, label: 'My Orders' },
      ];
    }

    // Admin and other roles see all items
    return [
      ...baseItems,
      { href: '/dashboard/projects', icon: <FaTasks className="mr-3 h-5 w-5" />, label: 'Projects' },
      { href: '/dashboard/contacts', icon: <FaUsers className="mr-3 h-5 w-5" />, label: 'Contacts' },
      { href: '/dashboard/products', icon: <FaBoxes className="mr-3 h-5 w-5" />, label: 'Products' },
      { href: '/dashboard/product-categories', icon: <FaLayerGroup className="mr-3 h-5 w-5" />, label: 'Product Categories' },
      { href: '/dashboard/orders', icon: <FaShoppingCart className="mr-3 h-5 w-5" />, label: 'Orders' },
      { href: '/dashboard/inventory', icon: <FaWarehouse className="mr-3 h-5 w-5" />, label: 'Inventory' },
      { href: '/dashboard/warehouses', icon: <FaBuilding className="mr-3 h-5 w-5" />, label: 'Warehouses' },
      { href: '/dashboard/cost-categories', icon: <FaTags className="mr-3 h-5 w-5" />, label: 'Cost Categories' },
      { href: '/dashboard/cms', icon: <FaEdit className="mr-3 h-5 w-5" />, label: 'CMS' },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <Link href="/" className="flex items-center">
              <FaSun className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">Payoff Solar</span>
            </Link>
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
                  <span className={isActive(item.href) ? 'text-green-500' : 'text-gray-500' }>
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
                  {userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Loading...' }
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userProfile?.role || 'Loading...'}
                </p>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center mt-1"
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
          className="fixed top-4 left-4 z-[60] inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
        >
          <span className="sr-only">Open sidebar</span>
          <FaBars className="h-6 w-6" />
        </button>

        {/* Mobile menu panel */}
        <div className={`fixed inset-0 z-50 ${mobileMenuOpen ? 'block' : 'hidden' }`}>
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
              <div className="flex-shrink-0 flex items-center px-4 pl-16">
                <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  <FaSun className="h-6 w-6 text-green-600 mr-2" />
                  <span className="text-xl font-bold text-gray-900">Payoff Solar</span>
                </Link>
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
                    <span className={isActive(item.href) ? 'text-green-500' : 'text-gray-500' }>
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
                    {userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Loading...' }
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'Loading...'}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center mt-1"
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
    </>
  );
}
