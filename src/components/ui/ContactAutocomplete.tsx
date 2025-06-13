'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Contact } from '@/lib/models';

interface ContactAutocompleteProps {
  value: string;
  onChange: (contactId: string, contactName: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}

export default function ContactAutocomplete({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = 'Search for a contact...',
  required = false,
  error = false
}: ContactAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Set initial selected contact when value changes
  useEffect(() => {
    if (value && contacts.length > 0) {
      const contact = contacts.find(c => c.id === value);
      if (contact) {
        setSelectedContact(contact);
        setSearchTerm(contact.name);
      }
    } else if (!value) {
      setSelectedContact(null);
      setSearchTerm('');
    }
  }, [value, contacts]);

  // Filter contacts based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts.slice(0, 10)); // Show first 10 contacts
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.phone && contact.phone.includes(searchTerm))
      ).slice(0, 10); // Limit to 10 results
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    
    // If user clears the input, clear the selection
    if (newSearchTerm === '') {
      setSelectedContact(null);
      onChange('', '');
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setSearchTerm(contact.name);
    setIsOpen(false);
    onChange(contact.id, contact.name);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for contact selection
    setTimeout(() => {
      setIsOpen(false);
      if (onBlur) {
        onBlur();
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        autoComplete="off"
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading contacts...</div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactSelect(contact)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{contact.name}</div>
                {contact.email && (
                  <div className="text-sm text-gray-500">{contact.email}</div>
                )}
                {contact.phone && (
                  <div className="text-sm text-gray-500">{contact.phone}</div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {searchTerm ? 'No contacts found' : 'Start typing to search contacts'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
