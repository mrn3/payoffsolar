'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/lib/models';

interface ProductAutocompleteProps {
  value: string;
  onChange: (productId: string, productName: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export default function ProductAutocomplete({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = 'Search for a product...',
  required = false,
  _error = false,
  disabled = false
}: ProductAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Set initial selected product when value changes
  useEffect(() => {
    // Don't try to set initial product if we're still loading products
    if (loading) return;

    if (value && products.length > 0) {
      const product = products.find(p => p.id === value);
      if (product) {
        setSelectedProduct(product);
        setSearchTerm(`${product.name} (${product.sku})`);
      } else {
        // Product ID provided but product not found in the list
        // Try to fetch the specific product by ID
        fetchProductById(value);
      }
    } else if (!value) {
      setSelectedProduct(null);
      setSearchTerm('');
    }
  }, [value, products, loading]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products.slice(0, 10)); // Show first 10 products
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 10); // Limit to 10 results
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const _response = await fetch('/api/products?limit=1000', {
        credentials: 'include'
      });
      if (_response.ok) {
        const _data = await _response.json();
        setProducts(_data.products || []);
      }
    } catch (_error) {
      console.error('Error fetching products:', _error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const product = data.product;
        if (product) {
          setSelectedProduct(product);
          setSearchTerm(`${product.name} (${product.sku})`);
          // Add the product to the products list if it's not already there
          setProducts(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (!exists) {
              return [...prev, product];
            }
            return prev;
          });
        }
      } else {
        console.warn(`Product with ID ${productId} not found`);
        setSelectedProduct(null);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      setSelectedProduct(null);
      setSearchTerm('');
    }
  };

  const handleInputChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = _e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);

    // If user clears the input, clear the selection
    if (newSearchTerm === '') {
      setSelectedProduct(null);
      onChange('', '');
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(`${product.name} (${product.sku})`);
    setIsOpen(false);
    onChange(product.id, product.name);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for product selection
    setTimeout(() => {
      setIsOpen(false);
      if (onBlur) {
        onBlur();
      }
    }, 200);
  };

  const handleKeyDown = (_e: React.KeyboardEvent) => {
    if (_e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(_event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(_event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                <div className="text-sm text-gray-500">{formatPrice(product.price)}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {searchTerm ? 'No products found' : 'Start typing to search products' }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
