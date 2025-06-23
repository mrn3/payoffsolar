'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import { Order, OrderItem, Contact, Product, CostCategory, CostItem } from '@/lib/models';
import ContactAutocomplete from '@/components/ui/ContactAutocomplete';
import {FaArrowLeft, FaPlus, FaTrash} from 'react-icons/fa';

// Local interface for form state that allows quantity to be string during editing
interface FormOrderItem {
  id?: string;
  product_id: string;
  quantity: number | string;
  price: number | string;
}

// Local interface for cost items in form state
interface FormCostItem {
  id?: string;
  category_id: string;
  amount: number | string;
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    contact_id: '',
    status: 'Proposed',
    order_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, price: 0 }] as FormOrderItem[],
    costItems: [] as FormCostItem[]
  });

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const [contactsRes, productsRes, costCategoriesRes, orderRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/products'),
        fetch('/api/cost-categories'),
        fetch(`/api/orders/${orderId}`)
      ]);

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }

      if (costCategoriesRes.ok) {
        const costCategoriesData = await costCategoriesRes.json();
        setCostCategories(costCategoriesData.categories || []);
      }

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const _order: Order = orderData.order;

        // Format order_date for HTML date input (YYYY-MM-DD)
        let formattedOrderDate = '';
        if (_order.order_date) {
          const date = new Date(_order.order_date);
          if (!isNaN(date.getTime())) {
            formattedOrderDate = date.toISOString().split('T')[0];
          }
        }

        setFormData({
          contact_id: _order.contact_id || '',
          status: _order.status || 'Proposed',
          order_date: formattedOrderDate,
          notes: _order.notes || '',
          items: _order.items && _order.items.length > 0
            ? _order.items.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: Number(item.price)
              }))
            : [{ product_id: '', quantity: 1, price: 0 }],
          costItems: _order.costItems && _order.costItems.length > 0
            ? _order.costItems.map(costItem => ({
                id: costItem.id,
                category_id: costItem.category_id,
                amount: Number(costItem.amount)
              }))
            : []
        });
      } else {
        setError('Failed to load order');
      }
    } catch (err) {
      console.error('Error fetching _data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const _response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (_response.ok) {
        router.push(`/dashboard/orders/${orderId}`);
      } else {
        const errorData = await _response.json();
        setError(errorData.error || 'Failed to update order');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, price: 0 }]
    }));
    // Note: No need to recalculate here since the new item has no product selected yet
  };

  const removeItem = (__index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== __index)
      }));

      // Trigger cost breakdown recalculation after a short delay to allow state to update
      setTimeout(() => {
        recalculateCostBreakdown();
      }, 100);
    }
  };

  const updateItem = (__index: number, field: keyof FormOrderItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === __index ? { ...item, [field]: value } : item
      )
    }));

    // Trigger cost breakdown recalculation after a short delay to allow state to update
    setTimeout(() => {
      recalculateCostBreakdown();
    }, 100);
  };

  const handleProductChange = (__index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateItem(__index, 'product_id', productId);
      updateItem(__index, 'price', product.price);
      // Cost breakdown will be recalculated by updateItem
    }
  };

  const addCostItem = () => {
    setFormData(prev => ({
      ...prev,
      costItems: [...prev.costItems, { category_id: '', amount: 0 }]
    }));
  };

  const removeCostItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      costItems: prev.costItems.filter((_, i) => i !== index)
    }));
  };

  const updateCostItem = (index: number, field: keyof FormCostItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      costItems: prev.costItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const recalculateCostBreakdown = async () => {
    try {
      // Only recalculate if we have valid items with products and quantities
      const validItems = formData.items.filter(item =>
        item.product_id &&
        item.quantity &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        item.price !== undefined &&
        typeof item.price === 'number'
      );

      if (validItems.length === 0) {
        return; // No valid items to calculate from
      }

      // Calculate cost items from product defaults
      const allCostItems = [];
      for (const item of validItems) {
        try {
          const response = await fetch(`/api/products/${item.product_id}/cost-breakdowns`, {
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            const costBreakdowns = data.costBreakdowns || [];

            // Calculate cost items for this product
            for (const breakdown of costBreakdowns) {
              let amount = 0;
              if (breakdown.calculation_type === 'percentage') {
                // Calculate percentage of total line item value (quantity * unit price)
                amount = (item.price * item.quantity * breakdown.value) / 100;
              } else {
                // Fixed amount per unit, multiplied by quantity
                amount = breakdown.value * item.quantity;
              }

              allCostItems.push({
                category_id: breakdown.category_id,
                amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
              });
            }
          }
        } catch (error) {
          console.error('Error fetching cost breakdowns for product:', item.product_id, error);
        }
      }

      // Merge cost items by category (sum amounts for same category)
      const mergedCostItems = new Map();
      for (const costItem of allCostItems) {
        const key = costItem.category_id;
        if (mergedCostItems.has(key)) {
          const existing = mergedCostItems.get(key);
          existing.amount += costItem.amount;
        } else {
          mergedCostItems.set(key, { ...costItem });
        }
      }

      // Update the form with the calculated cost items
      const newCostItems = Array.from(mergedCostItems.values()).map(item => ({
        category_id: item.category_id,
        amount: item.amount
      }));

      setFormData(prev => ({
        ...prev,
        costItems: newCostItems
      }));

    } catch (error) {
      console.error('Error recalculating cost breakdown:', error);
    }
  };

  const regenerateCostBreakdown = async () => {
    try {
      // Submit the order with items but without cost items to trigger auto-generation
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_id: formData.contact_id,
          status: formData.status,
          order_date: formData.order_date,
          notes: formData.notes,
          items: formData.items
          // Explicitly not including costItems to trigger auto-generation
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the form with the regenerated cost items
        if (data.order.costItems) {
          setFormData(prev => ({
            ...prev,
            costItems: data.order.costItems.map((item: any) => ({
              id: item.id,
              category_id: item.category_id,
              amount: item.amount
            }))
          }));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to regenerate cost breakdown');
      }
    } catch (err) {
      console.error('Error regenerating cost breakdown:', err);
      setError('Failed to regenerate cost breakdown');
    }
  };

  const calculateItemsTotal = () => {
    return formData.items.reduce((total, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price;
      const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) || 0 : item.quantity;
      return total + (price * quantity);
    }, 0);
  };

  const calculateCostItemsTotal = () => {
    return formData.costItems.reduce((total, item) => {
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) || 0 : item.amount;
      return total + amount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateItemsTotal(); // Cost breakdown doesn't affect order total
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/orders/${orderId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Order
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Order #{orderId.substring(0, 8)}</h1>
        <p className="mt-2 text-sm text-gray-700">
          Update order details and line items.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
                Contact *
              </label>
              <ContactAutocomplete
                value={formData.contact_id}
                onChange={(contactId, _contactName) => setFormData(prev => ({ ...prev, contact_id: contactId }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                placeholder="Search for a contact..."
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(_e) => setFormData(prev => ({ ...prev, status: _e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="Cancelled">Cancelled</option>
                <option value="Complete">Complete</option>
                <option value="Paid">Paid</option>
                <option value="Proposed">Proposed</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="order_date" className="block text-sm font-medium text-gray-700">
              Order Date *
            </label>
            <input
              type="date"
              id="order_date"
              required
              value={formData.order_date}
              onChange={(_e) => setFormData(prev => ({ ...prev, order_date: _e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(_e) => setFormData(prev => ({ ...prev, notes: _e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Optional notes about this order..."
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaPlus className="mr-2 h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, _index) => (
              <div key={_index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-md">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product *
                  </label>
                  <select
                    required
                    value={item.product_id}
                    onChange={(_e) => handleProductChange(_index, _e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(_e) => {
                      const value = _e.target.value;
                      // Allow empty string during editing, convert to number on blur
                      if (value === '') {
                        updateItem(_index, 'quantity', '');
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          updateItem(_index, 'quantity', numValue);
                        }
                      }
                    }}
                    onBlur={(_e) => {
                      // Ensure we have a valid number when field loses focus
                      const value = _e.target.value;
                      if (value === '' || parseInt(value) < 1) {
                        updateItem(_index, 'quantity', 1);
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.price}
                    onChange={(_e) => updateItem(_index, 'price', parseFloat(_e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div className="flex items-end">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(_index)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-lg font-semibold text-gray-900">
                Order Total: ${calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Cost Breakdown</h2>
              <p className="text-sm text-gray-500">Internal cost tracking (does not affect order total)</p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={regenerateCostBreakdown}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Auto-Generate from Products
              </button>
              <button
                type="button"
                onClick={addCostItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Add Cost Item
              </button>
            </div>
          </div>

          {formData.costItems.length > 0 ? (
            <div className="space-y-4">
              {formData.costItems.map((costItem, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <select
                      required
                      value={costItem.category_id}
                      onChange={(e) => updateCostItem(index, 'category_id', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                    >
                      <option value="">Select a category</option>
                      {costCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={costItem.amount}
                      onChange={(e) => updateCostItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeCostItem(index)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No cost items added yet. Click "Add Cost Item" to get started.
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-lg font-semibold text-gray-700">
                Internal Cost Total: ${calculateCostItemsTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                Order Total: ${calculateTotal().toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Cost Breakdown (${calculateCostItemsTotal().toFixed(2)}) is for internal tracking only
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/dashboard/orders/${orderId}`}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Update Order' }
          </button>
        </div>
      </form>
    </div>
  );
}
