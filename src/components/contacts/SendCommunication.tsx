'use client';

import React, { useState } from 'react';
import { FaEnvelope, FaSms, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Contact } from '@/lib/models';

interface SendCommunicationProps {
  contact: Contact;
  onCommunicationSent?: () => void;
}

type CommunicationType = 'email' | 'sms' | null;

export default function SendCommunication({ contact, onCommunicationSent }: SendCommunicationProps) {
  const [activeType, setActiveType] = useState<CommunicationType>(null);
  const [loading, setLoading] = useState(false);
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: ''
  });
  
  // SMS form state
  const [smsForm, setSmsForm] = useState({
    message: ''
  });

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email) {
      toast.error('Contact has no email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/communications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          to: contact.email,
          subject: emailForm.subject,
          text: emailForm.message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success('Email sent successfully!');
      setEmailForm({ subject: '', message: '' });
      setActiveType(null);
      onCommunicationSent?.();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.phone) {
      toast.error('Contact has no phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/communications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          to: contact.phone,
          message: smsForm.message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      toast.success('SMS sent successfully!');
      setSmsForm({ message: '' });
      setActiveType(null);
      onCommunicationSent?.();
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Send Communication</h2>
        <p className="mt-1 text-sm text-gray-500">
          Send an email or text message to this contact
        </p>
      </div>
      
      <div className="p-6">
        {!activeType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveType('email')}
              disabled={!contact.email}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaEnvelope className="h-5 w-5 mr-2 text-gray-400" />
              Send Email
              {!contact.email && <span className="ml-2 text-xs text-red-500">(No email)</span>}
            </button>
            
            <button
              onClick={() => setActiveType('sms')}
              disabled={!contact.phone}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSms className="h-5 w-5 mr-2 text-gray-400" />
              Send SMS
              {!contact.phone && <span className="ml-2 text-xs text-red-500">(No phone)</span>}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {activeType === 'email' ? 'Send Email' : 'Send SMS'}
              </h3>
              <button
                onClick={() => setActiveType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            {activeType === 'email' && (
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label htmlFor="email-to" className="block text-sm font-medium text-gray-700">
                    To
                  </label>
                  <input
                    type="email"
                    id="email-to"
                    value={contact.email}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="email-subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter email subject"
                  />
                </div>
                
                <div>
                  <label htmlFor="email-message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="email-message"
                    rows={6}
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your message"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveType(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      'Send Email'
                    )}
                  </button>
                </div>
              </form>
            )}
            
            {activeType === 'sms' && (
              <form onSubmit={handleSendSMS} className="space-y-4">
                <div>
                  <label htmlFor="sms-to" className="block text-sm font-medium text-gray-700">
                    To
                  </label>
                  <input
                    type="tel"
                    id="sms-to"
                    value={contact.phone}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="sms-message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="sms-message"
                    rows={4}
                    value={smsForm.message}
                    onChange={(e) => setSmsForm(prev => ({ ...prev, message: e.target.value }))}
                    required
                    maxLength={1600}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your message"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {smsForm.message.length}/1600 characters
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveType(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      'Send SMS'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
