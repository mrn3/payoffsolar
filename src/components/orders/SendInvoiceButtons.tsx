"use client";

import React, { useState } from 'react';
import { FaEnvelope, FaSms, FaFilePdf } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Props {
  orderId: string;
  contactId?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export default function SendInvoiceButtons({ orderId, contactId, contactEmail, contactPhone }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState<string>(contactEmail || '');
  const [phone, setPhone] = useState<string>(contactPhone || '');

  const sendEmail = async (mode: 'link' | 'pdf') => {
    const to = email.trim();
    if (!to) {
      toast.error('Please enter an email address');
      return;
    }
    setLoading(`email-${mode}`);
    try {
      const res = await fetch(`/api/orders/${orderId}/send-invoice-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, contactId, mode: mode === 'pdf' ? 'pdf' : 'link' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invoice email');
      toast.success(mode === 'pdf' ? 'Invoice PDF emailed' : 'Invoice link emailed');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email');
    } finally {
      setLoading(null);
    }
  };

  const sendSMS = async () => {
    const to = phone.trim();
    if (!to) {
      toast.error('Please enter a phone number');
      return;
    }
    setLoading('sms');
    try {
      const res = await fetch(`/api/orders/${orderId}/send-invoice-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, contactId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invoice SMS');
      toast.success('Invoice link texted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send SMS');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-64 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={() => sendEmail('pdf')}
          disabled={loading !== null}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          title="Email invoice as PDF (also includes link)"
        >
          <FaFilePdf className="mr-2 h-4 w-4" />
          Email PDF
        </button>
        <button
          onClick={() => sendEmail('link')}
          disabled={loading !== null}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          title="Email link to invoice"
        >
          <FaEnvelope className="mr-2 h-4 w-4" />
          Email Link
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="w-64 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={sendSMS}
          disabled={loading !== null}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          title="Text link to invoice"
        >
          <FaSms className="mr-2 h-4 w-4" />
          Text Link
        </button>
      </div>
    </div>
  );
}

