"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { FaDownload, FaEnvelope, FaSms, FaExternalLinkAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Props {
  kind: 'invoice' | 'receipt';
  orderId: string;
  contactId?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export default function DocumentActionsCard({ kind, orderId, contactId, contactEmail, contactPhone }: Props) {
  const [sending, setSending] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  // Editable email fields for the compose dialog
  const [toEmail, setToEmail] = useState(contactEmail || '');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const title = kind === 'invoice' ? 'Invoice' : 'Receipt';
  const viewHref = kind === 'invoice' ? `/api/orders/${orderId}/invoice` : `/api/orders/${orderId}/receipt`;
  const downloadHref = kind === 'invoice' ? `/api/orders/${orderId}/invoice/pdf` : `/api/orders/${orderId}/receipt/pdf`;
  const emailApi = kind === 'invoice' ? `/api/orders/${orderId}/send-invoice-email` : `/api/orders/${orderId}/send-receipt-email`;
  const smsApi = kind === 'invoice' ? `/api/orders/${orderId}/send-invoice-sms` : `/api/orders/${orderId}/send-receipt-sms`;

  const baseUrl = useMemo(() => {
    const envBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (envBase) return envBase.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  }, []);

  const viewUrl = useMemo(() => {
    if (!baseUrl) return viewHref;
    return `${baseUrl}${viewHref}`;
  }, [baseUrl, viewHref]);

  const subject = useMemo(() => {
    return `${title} From Payoff Solar — Order #${orderId.substring(0, 8)}`;
  }, [title, orderId]);

  const bodyPreview = useMemo(() => {
    return `A link to your ${title.toLowerCase()} is included below. A PDF copy is also be attached.`;
  }, [title]);

  const sendEmail = async () => {
    const to = (toEmail || contactEmail || '').trim();
    if (!to) return;
    setSending(true);
    try {
      const res = await fetch(emailApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, contactId, mode: 'pdf', subject: emailSubject, body: emailBody })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      toast.success(`${title} emailed`);
      setShowEmail(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const sendSms = async () => {
    if (!contactPhone) return;
    setSending(true);
    try {
      const res = await fetch(smsApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contactPhone, contactId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send text');
      toast.success(`${title} link texted`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send text');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">{title}</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">View</span>
          <Link href={viewHref} className="inline-flex items-center text-green-600 hover:text-green-800 text-sm">
            <FaExternalLinkAlt className="mr-2 h-4 w-4" /> Open
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Download</span>
          <Link href={downloadHref} className="inline-flex items-center text-gray-700 hover:text-gray-900 text-sm">
            <FaDownload className="mr-2 h-4 w-4" /> PDF
          </Link>
        </div>
        {contactEmail && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Email</span>
            <button
              onClick={() => { setToEmail(contactEmail || ''); setEmailSubject(subject); setEmailBody(`${bodyPreview}\n\n${viewUrl}`); setShowEmail(true); }}
              className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm"
            >
              <FaEnvelope className="mr-2 h-4 w-4" /> Compose
            </button>
          </div>
        )}
        {contactPhone && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Text</span>
            <button
              onClick={sendSms}
              disabled={sending}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
            >
              <FaSms className="mr-2 h-4 w-4" /> Send
            </button>
          </div>
        )}
      </div>

      {showEmail && contactEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-5">
            <h3 className="text-md font-semibold mb-3">Compose Email</h3>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-gray-500">From</div>
                <div className="text-gray-900">Payoff Solar &lt;matt@payoffsolar.com&gt;</div>
              </div>
              <div>
                <div className="text-gray-500">To</div>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <div className="text-gray-500">Subject</div>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <div className="text-gray-500">Body</div>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="text-xs text-gray-500 mt-1">Tip: include the link below if you want it in the message.</div>
                <p className="break-all text-green-700 mt-2">{viewUrl}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowEmail(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Cancel</button>
              <button onClick={sendEmail} disabled={sending} className="px-3 py-2 text-sm rounded-md bg-green-600 text-white disabled:opacity-50">Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

