'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaSolarPanel, FaBatteryFull, FaHome, FaCar, FaTruck, FaCheck, FaCalculator } from 'react-icons/fa';

interface SystemType {
  id: string;
  name: string;
  icon: React.ReactNode;
  subcategories?: SystemType[];
  subtypes?: string[];
}

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  required?: boolean;
}

interface CalculatorResult {
  panels: number;
  monthlySavings: number;
  systemType: string;
  services: string[];
  estimatedCost: number;
  inverterType: string;
  batteriesNeeded: boolean;
  annualSavings: number;
  paybackPeriod: number;
}

const systemTypes: SystemType[] = [
  {
    id: 'stationary',
    name: 'Stationary',
    icon: <FaHome className="h-6 w-6" />,
    subcategories: [
      { id: 'rooftop', name: 'Rooftop', icon: <FaHome className="h-4 w-4" /> },
      { id: 'ground-mount', name: 'Ground Mount', icon: <FaSolarPanel className="h-4 w-4" /> }
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile',
    icon: <FaCar className="h-6 w-6" />,
    subcategories: [
      {
        id: 'powered',
        name: 'Powered (it is propelled by an engine or a motor)',
        icon: <FaCar className="h-4 w-4" />,
        subtypes: ['Recreational Vehicle (RV)', 'Motor Home', 'Camper', 'Van', 'Bus', 'Moving Truck', 'Truck Camper']
      },
      {
        id: 'non-powered-roofed',
        name: 'Non-Powered Roofed (it is pulled by a tow vehicle and has a roof)',
        icon: <FaTruck className="h-4 w-4" />,
        subtypes: ['Travel Trailer', 'Toy Hauler', 'Car Hauler', 'Pop-Up Trailer', 'Fifth Wheel Trailer', 'Semi Trailer']
      },
      {
        id: 'non-powered-non-roofed',
        name: 'Non-Roofed (it is pulled by a tow vehicle and does not have a roof)',
        icon: <FaTruck className="h-4 w-4" />,
        subtypes: ['Flatbed Trailer', 'Gooseneck Trailer', 'Solar Trailer']
      }
    ]
  }
];

const serviceOptions: ServiceOption[] = [
  { id: 'equipment-purchase', name: 'Equipment Purchase', description: 'Solar panels, inverters, and mounting hardware', required: true },
  { id: 'equipment-delivery', name: 'Equipment Delivery', description: 'Professional delivery to your location' },
  { id: 'permitting', name: 'Permitting', description: 'Handle all necessary permits and paperwork' },
  { id: 'city-permit', name: 'City Permit', description: 'Local city building permits' },
  { id: 'grid-tie-approval', name: 'Power Company Grid-Tie Approval', description: 'Utility company interconnection approval' },
  { id: 'installation', name: 'Installation', description: 'Professional installation service' },
  { id: 'racking-installation', name: 'Racking/Mounting Hardware Installation', description: 'Professional mounting system installation' },
  { id: 'panel-mounting', name: 'Solar Panel Mounting', description: 'Expert panel installation and positioning' },
  { id: 'wiring', name: 'Wiring', description: 'Electrical connections and system wiring' },
  { id: 'financing', name: 'Financing', description: 'Flexible payment options and financing plans' },
  { id: 'warranty', name: 'Warranty', description: 'Comprehensive system warranty coverage' },
  { id: 'tax-credit', name: 'Tax Credit', description: 'Assistance with federal and state tax credit applications' }
];

export default function SolarCalculator() {
  const [selectedSystemType, setSelectedSystemType] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('');
  const [monthlySavings, setMonthlySavings] = useState<number>(50);
  const [selectedServices, setSelectedServices] = useState<string[]>(['equipment-purchase']);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  // Calculate panels based on monthly savings
  // Mobile: every $5 = 1 panel, Stationary: every $10 = 2 panels
  const panels = selectedSystemType === 'mobile'
    ? Math.max(1, Math.floor(monthlySavings / 5))
    : Math.max(2, Math.floor(monthlySavings / 10) * 2);

  useEffect(() => {
    if (selectedSystemType && selectedSubcategory) {
      // For mobile systems, also require subtype selection
      if (selectedSystemType === 'mobile') {
        if (selectedSubtype) {
          calculateSystem();
        }
      } else {
        calculateSystem();
      }
    }
  }, [selectedSystemType, selectedSubcategory, selectedSubtype, monthlySavings, selectedServices]);

  const calculateSystem = () => {
    const baseSystemCost = panels * 300; // $300 per panel base cost
    const serviceCosts = selectedServices.reduce((total, serviceId) => {
      const serviceCost = getServiceCost(serviceId);
      return total + serviceCost;
    }, 0);

    const estimatedCost = baseSystemCost + serviceCosts;
    const inverterType = panels <= 10 ? 'String Inverter' : 'Power Optimizers';
    const batteriesNeeded = selectedSubcategory.includes('mobile') || selectedServices.includes('equipment-purchase');
    const annualSavings = monthlySavings * 12;
    const paybackPeriod = Math.round(estimatedCost / annualSavings * 10) / 10; // Round to 1 decimal

    const systemTypeDisplay = selectedSystemType === 'mobile' && selectedSubtype
      ? `${selectedSystemType} - ${selectedSubcategory} - ${selectedSubtype}`
      : `${selectedSystemType} - ${selectedSubcategory}`;

    setResult({
      panels,
      monthlySavings,
      systemType: systemTypeDisplay,
      services: selectedServices,
      estimatedCost,
      inverterType,
      batteriesNeeded,
      annualSavings,
      paybackPeriod
    });
  };

  const getServiceCost = (serviceId: string): number => {
    const costs: Record<string, number> = {
      'equipment-purchase': 0, // Base cost included in panel cost
      'equipment-delivery': 200,
      'permitting': 500,
      'city-permit': 300,
      'grid-tie-approval': 400,
      'installation': panels * 100,
      'racking-installation': panels * 50,
      'panel-mounting': panels * 75,
      'wiring': panels * 25,
      'financing': 0, // Percentage-based, not added to base cost
      'warranty': panels * 20,
      'tax-credit': 150
    };
    return costs[serviceId] || 0;
  };

  const handleServiceToggle = (serviceId: string) => {
    const service = serviceOptions.find(s => s.id === serviceId);
    if (service?.required) return; // Can't toggle required services

    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getSystemTypeDisplay = () => {
    const mainType = systemTypes.find(t => t.id === selectedSystemType);
    if (!mainType) return '';

    const subType = mainType.subcategories?.find(s => s.id === selectedSubcategory);
    if (selectedSystemType === 'mobile' && selectedSubtype) {
      return `${mainType.name} - ${subType?.name || ''} - ${selectedSubtype}`;
    }
    return `${mainType.name} - ${subType?.name || ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FaCalculator className="h-8 w-8 text-green-600" />
          <h2 className="text-3xl font-bold text-gray-900">30-Second Solar Energy System Calculator</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Design your perfect solar system based on your needs, and get instant estimates for costs, and recommended solutions.
          Each solar panel you purchase will save you approximately $5/month. 
          Our goal is to help you find a solution that pays for itself in 5 years or less, since most solutions today are closer to 10-20 years. 
        </p>
      </div>

      {/* Step 1: System Type Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Choose Your System Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {systemTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedSystemType(type.id);
                setSelectedSubcategory('');
                setSelectedSubtype('');
                // Adjust monthly savings to fit the new system type's range
                if (type.id === 'mobile') {
                  // For mobile, default to $5 (1 panel)
                  setMonthlySavings(5);
                } else {
                  // For stationary, ensure value is within range and on $10 increments
                  if (monthlySavings < 10) {
                    setMonthlySavings(10);
                  } else {
                    // Round to nearest $10 increment for stationary
                    setMonthlySavings(Math.round(monthlySavings / 10) * 10);
                  }
                }
              }}
              className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                selectedSystemType === type.id
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-800'
              }`}
            >
              {type.icon}
              <span className="font-medium">{type.name}</span>
            </button>
          ))}
        </div>

        {/* Subcategory Selection */}
        {selectedSystemType && (
          <div className="ml-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Select Specific Type:</h4>
            <div className="space-y-2">
              {systemTypes
                .find(t => t.id === selectedSystemType)
                ?.subcategories?.map((subtype) => (
                <button
                  key={subtype.id}
                  onClick={() => {
                    setSelectedSubcategory(subtype.id);
                    setSelectedSubtype('');
                  }}
                  className={`w-full p-3 border rounded-lg flex items-center gap-3 text-left transition-colors ${
                    selectedSubcategory === subtype.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-800'
                  }`}
                >
                  {subtype.icon}
                  <span className="text-sm text-gray-800">{subtype.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Subtype Selection */}
        {selectedSystemType === 'mobile' && selectedSubcategory && (
          <div className="ml-8 mt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Select Specific Vehicle/Trailer Type:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {systemTypes
                .find(t => t.id === selectedSystemType)
                ?.subcategories?.find(s => s.id === selectedSubcategory)
                ?.subtypes?.map((subtype) => (
                <button
                  key={subtype}
                  onClick={() => setSelectedSubtype(subtype)}
                  className={`p-2 border rounded-lg text-left transition-colors text-sm ${
                    selectedSubtype === subtype
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-800'
                  }`}
                >
                  {subtype}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Monthly Savings Slider */}
      {selectedSubcategory && (selectedSystemType !== 'mobile' || selectedSubtype) && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">2. How much do you want to save each month?</h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              {selectedSystemType === 'mobile' ? (
                <>
                  <span className="text-sm text-gray-600">$5 (1 panel)</span>
                  <span className="text-lg font-bold text-green-600">${monthlySavings} ({panels} {panels === 1 ? 'panel' : 'panels'})</span>
                  <span className="text-sm text-gray-600">$300 (60 panels)</span>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">$10 (2 panels)</span>
                  <span className="text-lg font-bold text-green-600">${monthlySavings} ({panels} panels)</span>
                  <span className="text-sm text-gray-600">$500 (100 panels)</span>
                </>
              )}
            </div>
            <input
              type="range"
              min={selectedSystemType === 'mobile' ? "5" : "10"}
              max={selectedSystemType === 'mobile' ? "300" : "500"}
              step={selectedSystemType === 'mobile' ? "5" : "10"}
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="mt-3 text-center">
              <div className="text-sm text-gray-600">
                Estimated {panels} solar {panels === 1 ? 'panel' : 'panels'} for ${monthlySavings}/month savings
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Annual savings: ${(monthlySavings * 12).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Service Selection */}
      {selectedSubcategory && (selectedSystemType !== 'mobile' || selectedSubtype) && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Select Services You Need</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceOptions.map((service) => (
              <div
                key={service.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedServices.includes(service.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${service.required ? 'opacity-75' : ''}`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 border-2 rounded flex items-center justify-center ${
                    selectedServices.includes(service.id)
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedServices.includes(service.id) && (
                      <FaCheck className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {service.name}
                      {service.required && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
            <FaSolarPanel className="h-5 w-5" />
            Your Recommended Solar System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">System Specifications</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li><strong>System Type:</strong> {getSystemTypeDisplay()}</li>
                <li><strong>Solar Panels:</strong> {result.panels} panels</li>
                <li><strong>Inverter Type:</strong> {result.inverterType}</li>
                <li><strong>Batteries:</strong> {result.batteriesNeeded ? 'Recommended' : 'Optional'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Savings & ROI</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li><strong>Monthly Savings:</strong> ${result.monthlySavings}</li>
                <li><strong>Annual Savings:</strong> ${result.annualSavings.toLocaleString()}</li>
                <li><strong>Payback Period:</strong> {result.paybackPeriod} years</li>
                <li><strong>25-Year Savings:</strong> ${(result.annualSavings * 25).toLocaleString()}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Investment Details</h4>
              <div className="text-sm text-gray-700 mb-4">
                <div className="flex justify-between">
                  <span>Estimated System Cost:</span>
                  <span className="font-medium">${result.estimatedCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Services Selected:</span>
                  <span className="font-medium">{result.services.length} services</span>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  href={`/contact?system=${encodeURIComponent(getSystemTypeDisplay())}&panels=${result.panels}&savings=${result.monthlySavings}&cost=${result.estimatedCost}`}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors inline-block text-center"
                >
                  Get Detailed Quote
                </Link>
                <button
                  onClick={() => {
                    setSelectedSystemType('');
                    setSelectedSubcategory('');
                    setSelectedSubtype('');
                    setMonthlySavings(50);
                    setSelectedServices(['equipment-purchase']);
                    setResult(null);
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
