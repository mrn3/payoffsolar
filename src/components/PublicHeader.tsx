'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import { FaBars, FaChevronDown, FaSignOutAlt, FaSun, FaTimes, FaUser } from 'react-icons/fa';
import { UserProfile } from '@/lib/auth';
import CartIcon from '@/components/cart/CartIcon';

interface PublicHeaderProps {
  userProfile: UserProfile | null;
}

export default function PublicHeader({ userProfile }: PublicHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About Us' },
    { href: '/news', label: 'News' },
    { href: '/how-to', label: 'How To' },
    { href: '/contact', label: 'Contact' },
  ];

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

  const getUserDisplayName = () => {
    if (!userProfile) return '';
    const firstName = userProfile.first_name || '';
    const lastName = userProfile.last_name || '';
    return `${firstName} ${lastName}`.trim() || userProfile.email;
  };

	  const renderAvatar = () => {
	    if (userProfile?.avatar_url) {
	      return (
	        <img
	          src={userProfile.avatar_url}
	          alt={getUserDisplayName() || 'User avatar'}
	          className="h-6 w-6 rounded-full object-cover"
	        />
	      );
	    }

	    return (
	      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
	        <FaUser className="h-3 w-3 text-white" />
	      </div>
	    );
	  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <FaSun className="h-6 w-6 text-green-500" />
            <span className="text-xl font-bold text-gray-900">Payoff Solar</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href) ? 'text-green-500' : 'text-gray-700 hover:text-green-500'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <CartIcon />

	          {userProfile ? (
            // User is logged in - show user dropdown
            <div className="relative">
              <button
                type="button"
	                className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
	                {renderAvatar()}
                <span className="hidden sm:block">{getUserDisplayName()}</span>
                <FaChevronDown className="h-3 w-3" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500 capitalize">{userProfile.role || 'User'}</p>
                  </div>
	                  <Link
	                    href="/dashboard/account"
	                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
	                    onClick={() => setUserDropdownOpen(false)}
	                  >
	                    My Account
	                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FaSignOutAlt className="mr-2 h-3 w-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // User is not logged in - show login button
            <Link
              href="/login"
              className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
            >
              Login
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-700 hover:bg-gray-100"
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
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden' }`}>
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
          
          {/* Mobile user section */}
	              {userProfile && (
            <div className="border-t pt-3 mt-3">
              <div className="px-3 py-2">
                <div className="flex items-center">
	                  {userProfile.avatar_url ? (
	                    <img
	                      src={userProfile.avatar_url}
	                      alt={getUserDisplayName() || 'User avatar'}
	                      className="h-8 w-8 rounded-full object-cover"
	                    />
	                  ) : (
	                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
	                      <FaUser className="h-4 w-4 text-white" />
	                    </div>
	                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500 capitalize">{userProfile.role || 'User'}</p>
                  </div>
                </div>
              </div>
	              <Link
	                href="/dashboard/account"
	                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-green-500"
	                onClick={() => setMobileMenuOpen(false)}
	              >
	                My Account
	              </Link>
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-green-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-green-500 flex items-center"
              >
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {userDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserDropdownOpen(false)}
        />
      )}
    </header>
  );
}
