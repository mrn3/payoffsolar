'use client';

import React, { useState, useEffect } from 'react';
import { ShippingMethod, Warehouse } from '@/lib/models';
import { validateShippingMethod, DEFAULT_SHIPPING_METHODS } from '@/lib/utils/shipping';
import { FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';

interface ShippingMethodsEditorProps {
  value: ShippingMethod[];
  onChange: (methods: ShippingMethod[]) => void;
  warehouses?: Warehouse[];
}

type ShippingOption = 'ship_only' | 'pickup_only' | 'both';

export default function ShippingMethodsEditor({ value, onChange, warehouses = [] }: ShippingMethodsEditorProps) {
  const [methods, setMethods] = useState<ShippingMethod[]>(value || []);
  const [errors, setErrors] = useState<Record<number, string[]>>({});
  const [shippingOption, setShippingOption] = useState<ShippingOption>('ship_only');

  useEffect(() => {
    setMethods(value || []);

    // Determine current shipping option based on existing methods
    const hasShipping = (value || []).some(method => method.type !== 'local_pickup');
    const hasPickup = (value || []).some(method => method.type === 'local_pickup');

    if (hasShipping && hasPickup) {
      setShippingOption('both');
    } else if (hasPickup) {
      setShippingOption('pickup_only');
    } else {
      setShippingOption('ship_only');
    }
  }, [value]);

  const handleShippingOptionChange = (option: ShippingOption) => {
    setShippingOption(option);

    let newMethods: ShippingMethod[] = [];

    switch (option) {
      case 'ship_only':
        // Keep only shipping methods, remove pickup
        newMethods = methods.filter(method => method.type !== 'local_pickup');
        if (newMethods.length === 0) {
          // Add default shipping method if none exist
          newMethods = [{
            type: 'fixed',
            name: 'Standard Shipping',
            description: '3-5 business days',
            cost: 9.99
          }];
        }
        break;

      case 'pickup_only':
        // Keep only pickup methods, remove shipping
        newMethods = methods.filter(method => method.type === 'local_pickup');
        if (newMethods.length === 0) {
          // Add default pickup method if none exist
          newMethods = [{
            type: 'local_pickup',
            name: 'Local Pickup',
            description: 'Pick up from our location',
            pickup_location: ''
          }];
        }
        break;

      case 'both':
        // Keep all methods, add defaults if missing
        const hasShipping = methods.some(method => method.type !== 'local_pickup');
        const hasPickup = methods.some(method => method.type === 'local_pickup');

        newMethods = [...methods];

        if (!hasShipping) {
          newMethods.push({
            type: 'fixed',
            name: 'Standard Shipping',
            description: '3-5 business days',
            cost: 9.99
          });
        }

        if (!hasPickup) {
          newMethods.push({
            type: 'local_pickup',
            name: 'Local Pickup',
            description: 'Pick up from our location',
            pickup_location: ''
          });
        }
        break;
    }

    setMethods(newMethods);
    onChange(newMethods);
  };

  const handleMethodChange = (index: number, field: keyof ShippingMethod, fieldValue: any) => {
    const updatedMethods = [...methods];
    updatedMethods[index] = { ...updatedMethods[index], [field]: fieldValue };
    
    // Clear related fields when type changes
    if (field === 'type') {
      switch (fieldValue) {
        case 'free':
          delete updatedMethods[index].cost;
          delete updatedMethods[index].warehouse_id;
          delete updatedMethods[index].pickup_location;
          delete updatedMethods[index].api_config;
          break;
        case 'fixed':
          delete updatedMethods[index].warehouse_id;
          delete updatedMethods[index].pickup_location;
          delete updatedMethods[index].api_config;
          break;
        case 'calculated_distance':
          delete updatedMethods[index].cost;
          delete updatedMethods[index].pickup_location;
          delete updatedMethods[index].api_config;
          break;
        case 'api_calculated':
          delete updatedMethods[index].cost;
          delete updatedMethods[index].warehouse_id;
          delete updatedMethods[index].pickup_location;
          break;
        case 'local_pickup':
          delete updatedMethods[index].cost;
          delete updatedMethods[index].warehouse_id;
          delete updatedMethods[index].api_config;
          break;
      }
    }

    setMethods(updatedMethods);
    onChange(updatedMethods);
    
    // Validate the updated method
    const methodErrors = validateShippingMethod(updatedMethods[index]);
    setErrors(prev => ({
      ...prev,
      [index]: methodErrors
    }));
  };

  const addMethod = () => {
    // Determine what type of method to add based on current shipping option
    let newMethod: ShippingMethod;

    if (shippingOption === 'pickup_only') {
      newMethod = {
        type: 'local_pickup',
        name: '',
        description: '',
        pickup_location: ''
      };
    } else {
      newMethod = {
        type: 'fixed',
        name: '',
        description: '',
        cost: 0
      };
    }

    const updatedMethods = [...methods, newMethod];
    setMethods(updatedMethods);
    onChange(updatedMethods);
  };

  const removeMethod = (index: number) => {
    const updatedMethods = methods.filter((_, i) => i !== index);
    setMethods(updatedMethods);
    onChange(updatedMethods);
    
    // Remove errors for this method
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const addDefaultMethods = () => {
    const updatedMethods = [...methods, ...DEFAULT_SHIPPING_METHODS];
    setMethods(updatedMethods);
    onChange(updatedMethods);
  };

  const handleApiConfigChange = (index: number, provider: string) => {
    const updatedMethods = [...methods];
    updatedMethods[index] = {
      ...updatedMethods[index],
      api_config: {
        provider,
        settings: {}
      }
    };
    setMethods(updatedMethods);
    onChange(updatedMethods);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Shipping
        </label>

        {/* Shipping Option Selection */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center">
            <input
              type="radio"
              id="ship_only"
              name="shipping_option"
              value="ship_only"
              checked={shippingOption === 'ship_only'}
              onChange={(e) => handleShippingOptionChange(e.target.value as ShippingOption)}
              className="mr-2"
            />
            <label htmlFor="ship_only" className="text-sm text-gray-700">
              <strong>Ship your item:</strong> You select a fixed cost, or we calculate the cost for you based on package weight and dimensions.
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="pickup_only"
              name="shipping_option"
              value="pickup_only"
              checked={shippingOption === 'pickup_only'}
              onChange={(e) => handleShippingOptionChange(e.target.value as ShippingOption)}
              className="mr-2"
            />
            <label htmlFor="pickup_only" className="text-sm text-gray-700">
              <strong>Offer local pickup:</strong> Buyers pick up the item from your home or another site of your choosing.
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="radio"
              id="both"
              name="shipping_option"
              value="both"
              checked={shippingOption === 'both'}
              onChange={(e) => handleShippingOptionChange(e.target.value as ShippingOption)}
              className="mr-2"
            />
            <label htmlFor="both" className="text-sm text-gray-700">
              <strong>Offer both options</strong>
            </label>
          </div>
        </div>
      </div>

      {/* Methods Configuration */}
      {methods.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Configure Methods
            </h4>
            <button
              type="button"
              onClick={addMethod}
              className="flex items-center text-sm text-green-600 hover:text-green-800"
            >
              <FaPlus className="mr-1" />
              Add Method
            </button>
          </div>

          {methods.map((method, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-900">
                  {method.type === 'local_pickup' ? 'Pickup' : 'Shipping'} Method {index + 1}
                </h5>
                <button
                  type="button"
                  onClick={() => removeMethod(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={method.type}
                    onChange={(e) => handleMethodChange(index, 'type', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    {method.type === 'local_pickup' ? (
                      <option value="local_pickup">Local Pickup</option>
                    ) : (
                      <>
                        <option value="free">Free Shipping</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="calculated_distance">Calculated by Distance</option>
                        <option value="api_calculated">API Calculated</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={method.name}
                    onChange={(e) => handleMethodChange(index, 'name', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder={method.type === 'local_pickup' ? 'e.g., Local Pickup' : 'e.g., Standard Shipping'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={method.description || ''}
                  onChange={(e) => handleMethodChange(index, 'description', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder={method.type === 'local_pickup' ? 'e.g., Available weekdays 9-5' : 'e.g., 3-5 business days'}
                />
              </div>

              {method.type === 'local_pickup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                  <input
                    type="text"
                    value={method.pickup_location || ''}
                    onChange={(e) => handleMethodChange(index, 'pickup_location', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 123 Main St, City, State 12345"
                  />
                </div>
              )}

              {method.type === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={method.cost || ''}
                    onChange={(e) => handleMethodChange(index, 'cost', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              {method.type === 'calculated_distance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                  <select
                    value={method.warehouse_id || ''}
                    onChange={(e) => handleMethodChange(index, 'warehouse_id', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select a warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.city}, {warehouse.state}
                      </option>
                    ))}
                  </select>
                  {warehouses.length === 0 && (
                    <p className="mt-1 text-sm text-amber-600 flex items-center">
                      <FaInfoCircle className="mr-1" />
                      No warehouses configured. Add warehouses in the admin panel.
                    </p>
                  )}
                </div>
              )}

              {method.type === 'api_calculated' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shipping Provider</label>
                  <select
                    value={method.api_config?.provider || ''}
                    onChange={(e) => handleApiConfigChange(index, e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select a provider</option>
                    <option value="ups">UPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="usps">USPS</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    API credentials must be configured in the admin settings.
                  </p>
                </div>
              )}

              {errors[index] && errors[index].length > 0 && (
                <div className="text-sm text-red-600">
                  {errors[index].map((error, errorIndex) => (
                    <div key={errorIndex}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
