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
  productField: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResults {
  success: number;
  errors: number;
  errorDetails?: string[];
}

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const productFields = [
  { value: '', label: 'Do not import' },
  { value: 'name', label: 'Product Name *' },
  { value: 'description', label: 'Description' },
  { value: 'price', label: 'Price *' },
  { value: 'sku', label: 'SKU *' },
  { value: 'category_name', label: 'Category Name' },
  { value: 'category_id', label: 'Category ID' },
  { value: 'image_url', label: 'Image URL' },
  { value: 'is_active', label: 'Active Status' }
];

const autoMapColumn = (csvHeader: string): string => {
  const header = csvHeader.toLowerCase().trim();
  
  if (header.includes('name') || header.includes('title')) return 'name';
  if (header.includes('description') || header.includes('desc')) return 'description';
  if (header.includes('price') || header.includes('cost')) return 'price';
  if (header.includes('sku') || header.includes('code')) return 'sku';
  if (header.includes('category')) {
    if (header.includes('id')) return 'category_id';
    return 'category_name';
  }
  if (header.includes('image') || header.includes('photo') || header.includes('picture')) return 'image_url';
  if (header.includes('active') || header.includes('status') || header.includes('enabled')) return 'is_active';
  
  return '';
};

export default function ImportProductsModal({ isOpen, onClose, onImportComplete }: ImportProductsModalProps) {
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

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
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
          productField: autoMapColumn(header)
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

  const handleMappingChange = (csvColumn: string, productField: string) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, productField }
          : mapping
      )
    );
  };

  const validateData = () => {
    const errors: ValidationError[] = [];
    const requiredFields = ['name', 'sku', 'price'];
    
    // Check if required fields are mapped
    const mappedFields = columnMappings
      .filter(m => m.productField)
      .map(m => m.productField);
    
    requiredFields.forEach(field => {
      if (!mappedFields.includes(field)) {
        errors.push({
          row: 0,
          field,
          message: `Required field '${field}' is not mapped to any CSV column`
        });
      }
    });

    // Validate data rows
    csvData.forEach((row, index) => {
      columnMappings.forEach(mapping => {
        if (!mapping.productField) return;
        
        const value = row[mapping.csvColumn]?.trim();
        
        // Check required fields
        if (requiredFields.includes(mapping.productField) && !value) {
          errors.push({
            row: index + 1,
            field: mapping.productField,
            message: `${mapping.productField} is required but empty`
          });
        }
        
        // Validate price
        if (mapping.productField === 'price' && value && isNaN(Number(value))) {
          errors.push({
            row: index + 1,
            field: 'price',
            message: `Invalid price format: ${value}`
          });
        }
      });
    });

    setValidationErrors(errors);
    setStep('validation');
  };

  const handleImport = async () => {
    setStep('importing');
    setIsProcessing(true);

    try {
      // Transform CSV data to product format
      const products = csvData.map(row => {
        const product: any = {};
        columnMappings.forEach(mapping => {
          if (mapping.productField && mapping.productField !== '') {
            product[mapping.productField] = row[mapping.csvColumn]?.trim() || '';
          }
        });
        return product;
      });

      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });

      if (!response.ok) {
        throw new Error('Failed to import products');
      }

      const result = await response.json();
      setImportResults(result);
      setStep('complete');

    } catch (error) {
      toast.error('Error importing products: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
            Import Products from CSV
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
              Select a CSV file containing product data. The first row should contain column headers.
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
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Map CSV Columns</h4>
            <p className="text-sm text-gray-600 mb-6">
              Map your CSV columns to product fields. Name, SKU, and Price are required.
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
                      Map to Product Field
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
                          value={mapping.productField}
                          onChange={(e) => handleMappingChange(mapping.csvColumn, e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        >
                          {productFields.map(field => (
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue
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
                      Validation Passed
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>All {csvData.length} products are ready to import.</p>
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
                      <p>Please fix the following errors before importing:</p>
                      <ul className="mt-2 list-disc list-inside max-h-40 overflow-y-auto">
                        {validationErrors.map((error, index) => (
                          <li key={index}>
                            {error.row === 0 ? 'Mapping: ' : `Row ${error.row}: `}
                            {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Back
              </button>
              {validationErrors.length === 0 && (
                <button
                  onClick={handleImport}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Import Products
                </button>
              )}
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Importing Products</h4>
            <p className="text-sm text-gray-600">
              Please wait while we import your products...
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
                  <span className="text-gray-600 ml-1">products imported successfully</span>
                </div>
                <div>
                  <span className="font-medium text-red-600">{importResults.errors}</span>
                  <span className="text-gray-600 ml-1">products failed</span>
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
                View Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
