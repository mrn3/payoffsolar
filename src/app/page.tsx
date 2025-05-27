import Link from 'next/link';
import Image from 'next/image';
import { FaSolarPanel, FaBatteryFull, FaLeaf } from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="relative bg-gray-900 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Make your home more energy efficient
            </h1>
            <p className="text-xl mb-8">
              Save money and the planet with our premium solar solutions. Harness the power of the sun to reduce your energy bills and carbon footprint.
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

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Solar Solutions</h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              We offer a complete range of solar products and services to help you transition to clean, renewable energy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSolarPanel className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Solar Panels</h3>
              <p className="text-gray-700 mb-4">
                High-efficiency solar panels designed to maximize energy production even in low-light conditions.
              </p>
              <Link href="/products/solar-panels" className="text-green-600 font-medium hover:underline">
                Learn more
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBatteryFull className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Energy Storage</h3>
              <p className="text-gray-700 mb-4">
                Store excess energy for use during peak hours or power outages with our advanced battery solutions.
              </p>
              <Link href="/products/batteries" className="text-green-600 font-medium hover:underline">
                Learn more
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLeaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Save the Planet</h3>
              <p className="text-gray-700 mb-4">
                Reduce your carbon footprint and contribute to a sustainable future with clean, renewable energy.
              </p>
              <Link href="/about" className="text-green-600 font-medium hover:underline">
                Learn more
              </Link>
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
      <Footer />
    </div>
  );
}
