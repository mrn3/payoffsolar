import React from 'react';
import Link from 'next/link';
import { FaUser, FaSun } from 'react-icons/fa';
import { getUserProfile } from '@/lib/auth';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

export default async function DashboardLayout({
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
    <div className="flex h-screen bg-gray-100">
      <DashboardNavigation userProfile={userProfile} />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header - only visible on mobile */}
        <header className="w-full md:hidden">
          <div className="relative z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200 shadow-sm flex">
            <div className="flex-1 flex justify-between px-4">
              <div className="flex-1 flex">
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6">
                  {/* Mobile logo - centered horizontally */}
                  <div className="flex items-center justify-center h-full">
                    <Link href="/" className="flex items-center gap-2">
                      <FaSun className="h-6 w-6 text-green-500" />
                      <span className="text-xl font-bold text-gray-900">Payoff Solar</span>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex items-center">
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
