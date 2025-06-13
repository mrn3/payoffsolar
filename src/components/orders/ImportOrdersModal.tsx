'use client';

import React, { useState, useRef } from 'react';
import { FaTimes, FaUpload, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  orderField: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

interface ImportResults {
  success: number;
  errors: number;
  errorDetails?: string[];
}

interface ImportOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const orderFields = [
  { value: '', label: 'Do not import' },
  { value: 'contact_email', label: 'Contact Email' },
  { value: 'contact_name', label: 'Contact Name' },
  { value: 'status', label: 'Order Status' },
  { value: 'order_date', label: 'Order Date' },
  { value: 'notes', label: 'Order Notes' },
  { value: 'product_sku', label: 'Product SKU' },
  { value: 'product_name', label: 'Product Name' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'price', label: 'Price' },
];

const autoMapColumn = (header: string): string => {
  const lowerHeader = header.toLowerCase().trim();

  if (lowerHeader.includes('email')) return 'contact_email';
  if (lowerHeader.includes('first') && lowerHeader.includes('name')) return 'contact_first_name';
  if (lowerHeader.includes('last') && lowerHeader.includes('name')) return 'contact_last_name';
  if ((lowerHeader.includes('contact') && lowerHeader.includes('name')) ||
      (lowerHeader === 'name' || lowerHeader === 'customer' || lowerHeader === 'client')) return 'contact_name';
  if (lowerHeader.includes('status')) return 'status';
  if (lowerHeader.includes('order') && lowerHeader.includes('date')) return 'order_date';
  if (lowerHeader === 'date' || lowerHeader.includes('order_date')) return 'order_date';
  if (lowerHeader.includes('note')) return 'notes';
  if (lowerHeader.includes('sku')) return 'product_sku';
  if (lowerHeader.includes('product') && lowerHeader.includes('name')) return 'product_name';
  if (lowerHeader.includes('qty') || lowerHeader.includes('quantity')) return 'quantity';
  if (lowerHeader.includes('price') || lowerHeader.includes('cost') || lowerHeader.includes('amount')) return 'price';

  return '';
};

export default function ImportOrdersModal({ isOpen, onClose, onImportComplete }: ImportOrdersModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'validation' | 'importing' | 'complete'>('upload');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResults, setImportResults] = useState<ImportResults>({ success: 0, errors: 0 });
  const [showFailedRecords, setShowFailedRecords] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (step === 'importing') return; // Prevent closing during import
    
    // Reset state
    setStep('upload');
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMappings([]);
    setValidationErrors([]);
    setImportResults({ success: 0, errors: 0 });
    setShowFailedRecords(false);
    setIsProcessing(false);
    
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file: ' + results.errors[0].message);
          setIsProcessing(false);
          return;
        }

        const data = results.data as CSVRow[];
        const headers = Object.keys(data[0] || {});
        
        setCsvData(data);
        setCsvHeaders(headers);
        
        // Initialize column mappings
        const mappings: ColumnMapping[] = headers.map(header => ({
          csvColumn: header,
          orderField: autoMapColumn(header)
        }));
        setColumnMappings(mappings);
        
        setStep('mapping');
        setIsProcessing(false);
      },
      error: (error) => {
        toast.error('Error reading file: ' + error.message);
        setIsProcessing(false);
      }
    });
  };

  const updateColumnMapping = (csvColumn: string, orderField: string) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, orderField }
          : mapping
      )
    );
  };

  const validateData = () => {
    setIsProcessing(true);
    const errors: ValidationError[] = [];

    // Check if required mappings exist
    const mappedFields = columnMappings.filter(m => m.orderField !== '').map(m => m.orderField);
    
    if (!mappedFields.includes('contact_email') && !mappedFields.includes('contact_first_name') && !mappedFields.includes('contact_name')) {
      toast.error('You must map at least Contact Email, Contact Name, or Contact First Name to identify contacts.');
      setIsProcessing(false);
      return;
    }

    if (!mappedFields.includes('product_sku') && !mappedFields.includes('product_name')) {
      toast.error('You must map at least Product SKU or Product Name to identify products.');
      setIsProcessing(false);
      return;
    }

    if (!mappedFields.includes('quantity')) {
      toast.error('You must map the Quantity field.');
      setIsProcessing(false);
      return;
    }

    if (!mappedFields.includes('price')) {
      toast.error('You must map the Price field.');
      setIsProcessing(false);
      return;
    }

    // Validate data
    csvData.forEach((row, index) => {
      columnMappings.forEach(mapping => {
        if (mapping.orderField && mapping.orderField !== '') {
          const value = row[mapping.csvColumn]?.trim() || '';
          
          // Validate required fields
          if ((mapping.orderField === 'quantity' || mapping.orderField === 'price') && !value) {
            errors.push({
              row: index + 1,
              field: mapping.orderField,
              message: `${mapping.orderField} is required`,
              value: value
            });
          }
          
          // Validate quantity is a positive number
          if (mapping.orderField === 'quantity' && value) {
            const qty = parseInt(value);
            if (isNaN(qty) || qty <= 0) {
              errors.push({
                row: index + 1,
                field: mapping.orderField,
                message: 'Quantity must be a positive number',
                value: value
              });
            }
          }
          
          // Validate price is a non-negative number
          if (mapping.orderField === 'price' && value) {
            const price = parseFloat(value);
            if (isNaN(price) || price < 0) {
              errors.push({
                row: index + 1,
                field: mapping.orderField,
                message: 'Price must be a non-negative number',
                value: value
              });
            }
          }

          // Validate order_date format
          if (mapping.orderField === 'order_date' && value) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(value)) {
              errors.push({
                row: index + 1,
                field: mapping.orderField,
                message: 'Order date must be in YYYY-MM-DD format',
                value: value
              });
            }
          }
        }
      });
    });

    setValidationErrors(errors);
    setStep('validation');
    setIsProcessing(false);
  };

  const handleImport = async () => {
    setStep('importing');
    setIsProcessing(true);

    try {
      // Transform CSV data to order format
      const orderItems = csvData.map(row => {
        const item: any = {};
        columnMappings.forEach(mapping => {
          if (mapping.orderField && mapping.orderField !== '') {
            item[mapping.orderField] = row[mapping.csvColumn]?.trim() || '';
          }
        });
        return item;
      });

      const response = await fetch('/api/orders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItems })
      });

      if (!response.ok) {
        throw new Error('Failed to import orders');
      }

      const result = await response.json();
      setImportResults(result);
      setStep('complete');

    } catch (error) {
      toast.error('Error importing orders: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setStep('validation');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Import Orders from CSV
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="mb-6">
          <div className="flex items-center">
            {['upload', 'mapping', 'validation', 'importing', 'complete'].map((stepName, index) => (
              <React.Fragment key={stepName}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === stepName ? 'bg-green-600 text-white' :
                  ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Upload</span>
            <span>Map Columns</span>
            <span>Validate</span>
            <span>Import</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="text-center py-8">
            <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h4>
            <p className="text-sm text-gray-600 mb-6">
              Select a CSV file containing order data. Each row should represent one order item. The first row should contain column headers.
              Products and contacts will be created automatically if they don't exist.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Choose CSV File'}
            </button>
            <div className="mt-4 text-xs text-gray-500">
              <p>Expected columns: Contact Email/Name, Product SKU/Name, Quantity, Price, Order Date (optional), Status (optional), Notes (optional)</p>
              <p>Products and contacts will be created automatically if they don't exist in the system.</p>
              <p>Order Date should be in YYYY-MM-DD format. If not provided, today's date will be used.</p>
            </div>
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Map CSV Columns</h4>
            <p className="text-sm text-gray-600 mb-6">
              Map your CSV columns to order fields. Contact Email/Name, Product SKU/Name, Quantity, and Price are required.
              Products and contacts will be created automatically if they don't exist.
            </p>

            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CSV Column
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sample Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Map to Order Field
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {columnMappings.map((mapping, index) => (
                    <tr key={mapping.csvColumn}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mapping.csvColumn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {csvData[0]?.[mapping.csvColumn] || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={mapping.orderField}
                          onChange={(e) => updateColumnMapping(mapping.csvColumn, e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        >
                          {orderFields.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Back
              </button>
              <button
                onClick={validateData}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isProcessing ? 'Validating...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Validation Step */}
        {step === 'validation' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Validation Results</h4>

            {validationErrors.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <FaCheck className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Validation Successful
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>All {csvData.length} rows passed validation and are ready to import.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Validation Errors Found
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{validationErrors.length} errors found in your data. Please fix these issues before importing.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationErrors.map((error, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.row}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.field}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{error.message}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{error.value || '(empty)'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={validationErrors.length > 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Orders
              </button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Importing Orders</h4>
            <p className="text-sm text-gray-600">
              Please wait while we import your orders...
            </p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <FaCheck className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Import Complete</h4>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">{importResults.success}</span>
                  <span className="text-gray-600 ml-1">orders imported successfully</span>
                </div>
                <div>
                  <span className="font-medium text-red-600">{importResults.errors}</span>
                  <span className="text-gray-600 ml-1">orders failed</span>
                </div>
              </div>
            </div>

            {importResults.errors > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowFailedRecords(!showFailedRecords)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showFailedRecords ? 'Hide' : 'Show'} failed records
                </button>

                {showFailedRecords && importResults.errorDetails && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResults.errorDetails.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onImportComplete();
                  handleClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                View Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
