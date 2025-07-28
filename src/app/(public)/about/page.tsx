import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaLeaf, FaMoneyBillWave, FaSolarPanel } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Payoff Solar
            </h1>
            <p className="text-xl mb-8">
              We&apos;re on a mission to make renewable energy accessible to everyone. Learn about our journey, our team, and our commitment to a sustainable future.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Founded in 2024, Payoff Solar began with a simple mission: to make solar energy accessible, affordable, and hassle-free for homeowners and businesses alike.
              </p>
              <p className="text-gray-600 mb-4">
                What started as a small team of passionate renewable energy advocates has grown into a full-service solar provider, offering everything from consultation and system design to installation and ongoing maintenance.
              </p>
              <p className="text-gray-600">
                Over the years, we&apos;ve helped thousands of customers reduce their energy bills and carbon footprint, contributing to a cleaner, more sustainable future for all.
              </p>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden">
              <Image
                src="/solar_roofs.png"
                alt="Aerial view of residential neighborhood with solar panels on multiple homes"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core principles guide everything we do at Payoff Solar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSolarPanel className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Innovation</h3>
              <p className="text-gray-600 text-center">
                We continuously seek out the latest advancements in solar technology to provide our customers with the most efficient and reliable solutions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLeaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Sustainability</h3>
              <p className="text-gray-600 text-center">
                We&apos;re committed to reducing our environmental impact and helping our customers do the same through clean, renewable energy solutions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMoneyBillWave className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">Affordability</h3>
              <p className="text-gray-600 text-center">
                We believe that solar energy should be accessible to everyone, which is why we offer competitive pricing and flexible financing options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the dedicated professionals who make Payoff Solar the trusted name in solar energy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="relative h-80">
                <Image
                  src="/matt_newman.png"
                  alt="Matt Newman - Founder & CEO"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Matt Newman</h3>
                <p className="text-green-600 mb-4">Founder & CEO</p>
                <p className="text-gray-600">
                  With over 15 years of experience in renewable energy, Matt leads our team with passion and expertise.
                </p>
              </div>
            </div>
            {/* Team Member 2 */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="relative h-80">
                <Image
                  src="/jd_mcbride.png"
                  alt="JD McBride - Partner"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">JD McBride</h3>
                <p className="text-green-600 mb-4">Partner</p>
                <p className="text-gray-600">
                  JD ensures that we stay at the forefront of solar technology and installation best practices.
                </p>
              </div>
            </div>
            {/* Team Member 3 */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="relative h-80">
                <Image
                  src="/kip_denning.png"
                  alt="Kip Denning - Partner"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Kip Denning</h3>
                <p className="text-green-600 mb-4">Partner</p>
                <p className="text-gray-600">
                  Kip and his team ensure that every customer has a seamless experience from consultation to installation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join us in creating a sustainable future</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Ready to make the switch to solar? Contact us today to schedule a free consultation.
          </p>
          <Link
            href="/contact"
            className="bg-white text-green-600 px-8 py-3 rounded-md font-medium inline-block hover:bg-gray-100"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
