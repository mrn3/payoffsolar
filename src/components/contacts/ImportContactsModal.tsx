'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { FaTimes, FaUpload, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  contactField: string;
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

const CONTACT_FIELDS = [
  { key: '', label: 'Skip this column' },
  { key: 'name', label: 'Name *', required: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP Code' },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Date Created' }
];

export default function ImportContactsModal({ isOpen, onClose, onImportComplete }: ImportContactsModalProps) {
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

  const handleFileUpload = (_event: React.ChangeEvent<HTMLInputElement>) => {
    const _file = _event.target.files?.[0];
    if (!_file) return;

    if (!_file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsProcessing(true);
    Papa.parse(_file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file: ' + results.errors[0].message);
          setIsProcessing(false);
          return;
        }

                const _data = results.data as CSVRow[];
        const headers = Object.keys(_data[0] || {});

        setCsvData(_data);
        setCsvHeaders(headers);
        
        // Initialize column mappings
        const mappings: ColumnMapping[] = headers.map(header => ({
          csvColumn: header,
          contactField: autoMapColumn(header)
        }));
        setColumnMappings(mappings);
        
        setStep('mapping');
        setIsProcessing(false);
      },
      error: (_error) => {
        toast.error('Error reading file: ' + (_error instanceof Error ? _error.message : String(_error)));
        setIsProcessing(false);
      }
    });
  };

  const autoMapColumn = (csvHeader: string): string => {
    const header = csvHeader.toLowerCase().trim();

    if (header.includes('name')) return 'name';
    if (header.includes('email')) return 'email';
    if (header.includes('phone')) return 'phone';
    if (header.includes('address')) return 'address';
    if (header.includes('city')) return 'city';
    if (header.includes('state')) return 'state';
    if (header.includes('zip') || header.includes('postal')) return 'zip';
    if (header.includes('note')) return 'notes';
    if (header.includes('created') || header.includes('date created') || header.includes('date_created')) return 'created_at';

    return '';
  };

  const updateColumnMapping = (csvColumn: string, contactField: string) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, contactField }
          : mapping
      )
    );
  };

  const validateMappings = () => {
    const mappedFields = columnMappings
      .filter(m => m.contactField !== '')
      .map(m => m.contactField);

    const hasName = mappedFields.includes('name');

    if (!hasName) {
      toast.error('Name is a required field. Please map this column.');
      return false;
    }

    return true;
  };

  const validateData = () => {
    if (!validateMappings()) return;

    setIsProcessing(true);
    const errors: ValidationError[] = [];

    csvData.forEach((row, _index) => {
      columnMappings.forEach(mapping => {
        if (mapping.contactField === '') return;

        const value = row[mapping.csvColumn]?.trim() || '';

        // Check required fields
        if (mapping.contactField === 'name' && !value) {
          errors.push({
            row: _index + 1,
            field: mapping.contactField,
            message: 'This field is required',
            value
          });
        }

        // Validate email format
        if (mapping.contactField === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              row: _index + 1,
              field: 'email',
              message: 'Invalid email format',
              value
            });
          }
        }

        // Validate phone format
        if (mapping.contactField === 'phone' && value) {
          const phoneDigits = value.replace(/\D/g, '');
          if (phoneDigits.length < 10 || (phoneDigits.length === 11 && !phoneDigits.startsWith('1')) || phoneDigits.length > 11) {
            errors.push({
              row: _index + 1,
              field: 'phone',
              message: 'Phone number must be 10 digits or 11 digits starting with 1',
              value
            });
          }
        }

        // Validate date format for created_at
        if (mapping.contactField === 'created_at' && value) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(value)) {
            errors.push({
              row: _index + 1,
              field: 'created_at',
              message: 'Date must be in YYYY-MM-DD format',
              value
            });
          } else {
            // Validate that it's a valid date
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              errors.push({
                row: _index + 1,
                field: 'created_at',
                message: 'Invalid date',
                value
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
      // Transform CSV data to contact format
      const contacts = csvData.map(row => {
        const contact: any = {};
        columnMappings.forEach(mapping => {
          if (mapping.contactField && mapping.contactField !== '') {
            contact[mapping.contactField] = row[mapping.csvColumn]?.trim() || '';
          }
        });
        return contact;
      });

      const _response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      });

      if (!_response.ok) {
        throw new Error('Failed to import contacts');
      }

      const result = await _response.json();
      setImportResults(result);
      setStep('complete');

    } catch (_error) {
      toast.error('Error importing contacts: ' + (_error instanceof Error ? _error.message : 'Unknown error'));
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
            Import Contacts from CSV
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
            {['upload', 'mapping', 'validation', 'importing', 'complete'].map((stepName, _index) => (
              <React.Fragment key={stepName}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === stepName ? 'bg-green-600 text-white' :
                  ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > _index ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {_index + 1}
                </div>
                {_index < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > _index ? 'bg-green-600' : 'bg-gray-300'
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
              Select a CSV file containing contact data. The first row should contain column headers.
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
              {isProcessing ? 'Processing...' : 'Choose CSV File' }
            </button>
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Map CSV Columns</h4>
            <p className="text-sm text-gray-600 mb-6">
              Map your CSV columns to contact fields. Name is required.
            </p>

            {/* Preview of CSV data */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-900 mb-2">CSV Preview (first 3 rows):</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {csvHeaders.map((header, _index) => (
                        <th key={_index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
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
              {columnMappings.map((mapping, _index) => (
                <div key={_index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">
                      CSV Column: <span className="font-normal">{mapping.csvColumn}</span>
                    </label>
                  </div>
                  <div className="flex-1">
                    <select
                      value={mapping.contactField}
                      onChange={(_e) => updateColumnMapping(mapping.csvColumn, _e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    >
                      {CONTACT_FIELDS.map((field) => (
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
                {isProcessing ? 'Validating...' : 'Continue' }
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
                    {validationErrors.map((_error, _index) => (
                      <tr key={_index}>
                        <td className="px-3 py-2 text-sm text-gray-900">{_error.row}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{_error.field}</td>
                        <td className="px-3 py-2 text-sm text-red-600">{_error.message}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{_error.value || '(empty)'}</td>
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
                  Import Contacts
                </button>
              )}
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Importing Contacts</h4>
            <p className="text-sm text-gray-600">
              Please wait while we import your contacts...
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
                  <span className="font-medium text-green-600">{importResults.success}</span> contacts imported successfully
                </p>
                {importResults.errors > 0 && (
                  <p>
                    <span className="font-medium text-red-600">{importResults.errors}</span> contacts failed to import
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
                      {showFailedRecords ? 'Hide Details' : 'Show Details' }
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
                        {importResults.errorDetails.map((_error, _index) => (
                          <tr key={_index}>
                            <td className="px-3 py-2 text-sm text-red-600">{_error}</td>
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
                View Contacts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
