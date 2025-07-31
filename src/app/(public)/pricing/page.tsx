import Link from 'next/link';
import { FaHome, FaSolarPanel, FaBolt, FaIndustry, FaCheck, FaLeaf } from 'react-icons/fa';

export default function PricingPage() {
  const packages = [
    {
      _id: 'starter',
      name: 'Starter Package',
      icon: <FaLeaf className="h-8 w-8" />,
      price: '$2,400',
      originalPrice: '$4,800',
      priceWithTaxCredit: '$1,680',
      description: 'Perfect way to get started - in Utah, complies with House Bill 340 so you don\t need to pay for permits.',
      power: '1.2 kW',
      panels: '3 panels',
      coverage: '500 sq ft',
      features: [
        'High-efficiency solar panels',
        'Micro inverter system',
        'Basic monitoring system',
        'Professional installation',
        '10-year warranty',
        'Basic maintenance guide'
      ],
      popular: false
    },
    {
      _id: 'small',
      name: 'Small Package',
      icon: <FaHome className="h-8 w-8" />,
      price: '$6,000',
      originalPrice: '$12,000',
      priceWithTaxCredit: '$4,200',
      description: 'Perfect for small homes and apartments',
      power: '4 kW',
      panels: '10 panels',
      coverage: '1500 sq ft',
      features: [
        'High-efficiency solar panels',
        'String inverter system',
        'Basic monitoring system',
        'Professional installation',
        '10-year warranty',
        'Net metering setup',
        'Permit assistance',
        'Basic maintenance guide'
      ],
      popular: false
    },
    {
      _id: 'medium',
      name: 'Medium Package',
      icon: <FaSolarPanel className="h-8 w-8" />,
      price: '$9,000',
      originalPrice: '$18,000',
      priceWithTaxCredit: '$6,300',
      description: 'Ideal for average-sized homes',
      power: '8 kW',
      panels: '20 panels',
      coverage: '2500 sq ft',
      features: [
        'Premium solar panels',
        'Power optimizers',
        'Advanced monitoring system',
        'Professional installation',
        '15-year warranty',
        'Net metering setup',
        'Permit assistance',
        'Annual maintenance check',
        'Energy storage ready',
        'Smart home integration'
      ],
      popular: true
    },
    {
      _id: 'large',
      name: 'Large Package',
      icon: <FaBolt className="h-8 w-8" />,
      price: '$12,000',
      originalPrice: '$24,000',
      priceWithTaxCredit: '$8,400',
      description: 'Great for large homes and high energy usage',
      power: '12 kW',
      panels: '30 panels',
      coverage: '4000 sq ft',
      features: [
        'Premium high-efficiency panels',
        'Microinverter system',
        'Advanced monitoring & analytics',
        'Professional installation',
        '20-year warranty',
        'Net metering setup',
        'Permit assistance',
        'Bi-annual maintenance',
        'Battery storage included',
        'Smart home integration',
        'EV charging ready',
        'Production guarantee'
      ],
      popular: false
    },
    {
      _id: 'extra-large',
      name: 'Extra Large Package',
      icon: <FaIndustry className="h-8 w-8" />,
      price: '$15,000',
      originalPrice: '$30,000',
      priceWithTaxCredit: '$10,500',
      description: 'Perfect for large properties and commercial use',
      power: '16 kW',
      panels: '40 panels',
      coverage: '6000 sq ft',
      features: [
        'Commercial-grade solar panels',
        'Microinverter system',
        'Enterprise monitoring platform',
        'Professional installation',
        '25-year warranty',
        'Net metering setup',
        'Permit assistance',
        'Quarterly maintenance',
        'Large battery storage system',
        'Smart grid integration',
        'Multiple EV charging stations',
        'Production guarantee',
        'Energy management system',
        'Priority support'
      ],
      popular: false
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gray-900 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Solar Installation Packages
            </h1>
            <p className="text-xl mb-8">
              Choose the perfect solar solution for your home or business. All packages include professional installation, warranties, and ongoing support.
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 inline-block">
              <p className="text-lg font-semibold mb-2">Limited Time Offer</p>
              <p className="text-sm">Save up to $15,000 on your solar installation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Choose Your Solar Package</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our solar installation packages are designed to meet different energy needs and budgets. Each package includes everything you need to start saving on your energy bills.
              <br /><br />
              Note that you can also get a 30% federal tax credit for solar installations (off of the prices shown below), which can further reduce your out-of-pocket costs.  This tax credit is only available for installations completed before the end of 2025.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                id={pkg._id}
                className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                  pkg.popular ? 'ring-2 ring-green-500 transform scale-105' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className={`p-6 ${pkg.popular ? 'pt-12' : ''}`}>
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                    <span className="text-green-600">{pkg.icon}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-2 text-gray-900">{pkg.name}</h3>
                  <p className="text-gray-600 text-center mb-4">{pkg.description}</p>
                  
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{pkg.price}</span>
                      <span className="text-lg text-gray-500 line-through">{pkg.originalPrice}</span>
                    </div>
                    <p className="text-green-600 font-semibold">With 30% tax credit: {pkg.priceWithTaxCredit}</p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">System Size:</span>
                      <span className="font-semibold text-gray-900">{pkg.power}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Panels:</span>
                      <span className="font-semibold text-gray-900">{pkg.panels}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coverage:</span>
                      <span className="font-semibold text-gray-900">{pkg.coverage}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-8">
                    {pkg.features.map((feature, _index) => (
                      <li key={_index} className="flex items-start">
                        <FaCheck className="h-4 w-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contact"
                    className={`block w-full text-center py-3 px-4 rounded-md font-medium transition-colors ${
                      pkg.popular
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Get Quote
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Why Choose Our Solar Packages?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every package includes comprehensive support and premium components to ensure maximum energy savings and system reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Complete Installation</h3>
              <p className="text-gray-600">
                Professional installation, permits, and grid connection all included in every package.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBolt className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Immediate Savings</h3>
              <p className="text-gray-600">
                Start saving on your energy bills from day one with our efficient solar systems.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSolarPanel className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Premium Components</h3>
              <p className="text-gray-600">
                Only the highest quality solar panels and inverters with industry-leading warranties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Saving?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Contact us today for a free consultation and personalized quote. Our solar experts will help you choose the perfect package for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-green-600 px-8 py-3 rounded-md font-medium inline-block hover:bg-gray-100"
            >
              Get Free Quote
            </Link>
            <Link
              href="/products"
              className="bg-transparent border border-white text-white px-8 py-3 rounded-md font-medium inline-block hover:bg-white/10"
            >
              View Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
