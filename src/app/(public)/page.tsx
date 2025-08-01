'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaBatteryFull, FaLeaf, FaSolarPanel } from 'react-icons/fa';
import SolarCalculator from '@/components/SolarCalculator';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

export default function HomePage() {
  const searchParams = useSearchParams();
  const { applyAffiliateCode, state } = useCart();

  // Check for affiliate code in URL
  useEffect(() => {
    const affiliateCode = searchParams.get('ref');
    if (affiliateCode && !state.affiliateCode) {
      handleAffiliateCode(affiliateCode);
    }
  }, [searchParams, state.affiliateCode]);

  const handleAffiliateCode = async (code: string) => {
    try {
      const response = await fetch(`/api/public/affiliate-codes/${code}`);
      if (response.ok) {
        const data = await response.json();
        applyAffiliateCode(data.affiliateCode);
        toast.success(`Discount code "${code}" applied!`);
      } else {
        console.warn('Invalid affiliate code:', code);
      }
    } catch (error) {
      console.error('Error applying affiliate code:', error);
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Flooding The Earth With Affordable Solar
            </h1>
            <p className="text-xl mb-8">
              Payoff Solar is a provider of solar energy equipment and services.
              Our mission is to make solar energy accessible, affordable, and hassle-free for everyone.
              <br /><br />
              While solar has benefits of saving the planet and energy independence, our main focus is to make it pay off financially
              within 3-4 years, rather than the industry-standard 15-20 years.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="bg-white text-green-600 px-6 py-3 rounded-md font-medium text-center hover:bg-gray-100"
              >
                Get a Free Quote
              </Link>
              <Link
                href="/products"
                className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-medium text-center hover:bg-white/10"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Solar Calculator Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <SolarCalculator />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Solar Solutions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer a complete range of solar products and services to help you transition to clean, renewable energy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSolarPanel className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Solar Panels</h3>
              <p className="text-gray-600 mb-4">
                High-efficiency solar panels designed to maximize energy production even in low-light conditions.
              </p>
              <Link href="/products/category/solar-panels" className="text-green-600 font-medium hover:underline">
                Learn more
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBatteryFull className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Energy Storage</h3>
              <p className="text-gray-600 mb-4">
                Store excess energy for use during peak hours or power outages with our advanced battery solutions.
              </p>
              <Link href="/products/category/batteries" className="text-green-600 font-medium hover:underline">
                Learn more
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLeaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Save the Planet</h3>
              <p className="text-gray-600 mb-4">
                Reduce your carbon footprint and contribute to a sustainable future with clean, renewable energy.
              </p>
              <Link href="/about" className="text-green-600 font-medium hover:underline">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Save energy in 3 simple steps</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our streamlined process makes it easy to switch to solar energy and start saving.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">We take a quick look</h3>
                <p className="text-gray-600">
                  Our experts assess your property and energy needs to design the perfect solar solution for you.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">We send you a proposal</h3>
                <p className="text-gray-600">
                  Receive a detailed proposal with system specifications, costs, and projected energy savings.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">We install your system</h3>
                <p className="text-gray-600">
                  Our professional team handles the entire installation process, from permits to final inspection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start saving?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Contact us today for a free consultation and quote. Start your journey towards energy independence.
          </p>
          <Link
            href="/contact"
            className="bg-white text-green-600 px-8 py-3 rounded-md font-medium inline-block hover:bg-gray-100"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
