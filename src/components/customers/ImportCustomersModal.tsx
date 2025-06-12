'use client';

import React, { useState, useRef } from 'react';
import { FaTimes, FaUpload, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Papa from 'papaparse';

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  customerField: string;
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

const CUSTOMER_FIELDS = [
  { key: '', label: 'Skip this column' },
  { key: 'first_name', label: 'First Name *', required: true },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP Code' },
  { key: 'notes', label: 'Notes' }
];

export default function ImportCustomersModal({ isOpen, onClose, onImportComplete }: ImportCustomersModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'validation' | 'importing' | 'complete'>('upload');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResults, setImportResults] = useState<ImportResults>({ success: 0, errors: 0 });
  const [showFailedRecords, setShowFailedRecords] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setStep('upload');
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMappings([]);
    setValidationErrors([]);
    setImportResults({ success: 0, errors: 0 });
    setShowFailedRecords(false);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          alert('Error parsing CSV file: ' + results.errors[0].message);
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
          customerField: autoMapColumn(header)
        }));
        setColumnMappings(mappings);
        
        setStep('mapping');
        setIsProcessing(false);
      },
      error: (error) => {
        alert('Error reading file: ' + error.message);
        setIsProcessing(false);
      }
    });
  };

  const autoMapColumn = (csvHeader: string): string => {
    const header = csvHeader.toLowerCase().trim();
    
    if (header.includes('first') && header.includes('name')) return 'first_name';
    if (header.includes('last') && header.includes('name')) return 'last_name';
    if (header.includes('email')) return 'email';
    if (header.includes('phone')) return 'phone';
    if (header.includes('address')) return 'address';
    if (header.includes('city')) return 'city';
    if (header.includes('state')) return 'state';
    if (header.includes('zip') || header.includes('postal')) return 'zip';
    if (header.includes('note')) return 'notes';
    
    return '';
  };

  const updateColumnMapping = (csvColumn: string, customerField: string) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, customerField }
          : mapping
      )
    );
  };

  const validateMappings = () => {
    const mappedFields = columnMappings
      .filter(m => m.customerField !== '')
      .map(m => m.customerField);
    
    const hasFirstName = mappedFields.includes('first_name');
    const hasLastName = mappedFields.includes('last_name');
    
    if (!hasFirstName || !hasLastName) {
      alert('First Name and Last Name are required fields. Please map these columns.');
      return false;
    }
    
    return true;
  };

  const validateData = () => {
    if (!validateMappings()) return;

    setIsProcessing(true);
    const errors: ValidationError[] = [];

    csvData.forEach((row, index) => {
      columnMappings.forEach(mapping => {
        if (mapping.customerField === '') return;

        const value = row[mapping.csvColumn]?.trim() || '';

        // Check required fields
        if (mapping.customerField === 'first_name' && !value) {
          errors.push({
            row: index + 1,
            field: mapping.customerField,
            message: 'This field is required',
            value
          });
        }

        // Validate email format
        if (mapping.customerField === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              row: index + 1,
              field: 'email',
              message: 'Invalid email format',
              value
            });
          }
        }

        // Validate phone format
        if (mapping.customerField === 'phone' && value) {
          const phoneDigits = value.replace(/\D/g, '');
          if (phoneDigits.length < 10) {
            errors.push({
              row: index + 1,
              field: 'phone',
              message: 'Phone number must be at least 10 digits',
              value
            });
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
      // Transform CSV data to customer format
      const customers = csvData.map(row => {
        const customer: any = {};
        columnMappings.forEach(mapping => {
          if (mapping.customerField && mapping.customerField !== '') {
            customer[mapping.customerField] = row[mapping.csvColumn]?.trim() || '';
          }
        });
        return customer;
      });

      const response = await fetch('/api/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers })
      });

      if (!response.ok) {
        throw new Error('Failed to import customers');
      }

      const result = await response.json();
      setImportResults(result);
      setStep('complete');

    } catch (error) {
      alert('Error importing customers: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
            Import Customers from CSV
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
              Select a CSV file containing customer data. The first row should contain column headers.
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
              Map your CSV columns to customer fields. First Name is required.
            </p>

            {/* Preview of CSV data */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-900 mb-2">CSV Preview (first 3 rows):</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvHeaders.map((header, index) => (
                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.slice(0, 3).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {csvHeaders.map((header, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                            {row[header] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column mapping */}
            <div className="space-y-4">
              <h5 className="text-sm font-medium text-gray-900">Column Mapping:</h5>
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      CSV Column: <span className="font-normal">{mapping.csvColumn}</span>
                    </label>
                  </div>
                  <div className="flex-1">
                    <select
                      value={mapping.customerField}
                      onChange={(e) => updateColumnMapping(mapping.csvColumn, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    >
                      {CUSTOMER_FIELDS.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
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
                      <p>{validationErrors.length} errors found. Please fix these issues before importing:</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validationErrors.map((error, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-900">{error.row}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{error.field}</td>
                        <td className="px-3 py-2 text-sm text-red-600">{error.message}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{error.value || '(empty)'}</td>
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
              {validationErrors.length === 0 && (
                <button
                  onClick={handleImport}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Import Customers
                </button>
              )}
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Importing Customers</h4>
            <p className="text-sm text-gray-600">
              Please wait while we import your customers...
            </p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="py-8">
            <div className="text-center mb-6">
              <FaCheck className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Import Complete</h4>
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <span className="font-medium text-green-600">{importResults.success}</span> customers imported successfully
                </p>
                {importResults.errors > 0 && (
                  <p>
                    <span className="font-medium text-red-600">{importResults.errors}</span> customers failed to import
                  </p>
                )}
              </div>
            </div>

            {/* Failed Records Section */}
            {importResults.errors > 0 && importResults.errorDetails && importResults.errorDetails.length > 0 && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Failed Records Details
                        </h3>
                        <div className="mt-1 text-sm text-red-700">
                          <p>The following records could not be imported:</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFailedRecords(!showFailedRecords)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      {showFailedRecords ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                </div>

                {showFailedRecords && (
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importResults.errorDetails.map((error, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-red-600">{error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                View Customers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
