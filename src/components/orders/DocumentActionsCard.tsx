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

  const title = kind === 'invoice' ? 'Invoice' : 'Receipt';
  const viewHref = kind === 'invoice' ? `/api/orders/${orderId}/invoice` : `/api/orders/${orderId}/receipt`;
  const downloadHref = kind === 'invoice' ? `/api/orders/${orderId}/invoice/pdf` : `/api/orders/${orderId}/receipt/pdf`;
  const emailApi = kind === 'invoice' ? `/api/orders/${orderId}/send-invoice-email` : `/api/orders/${orderId}/send-receipt-email`;
  const smsApi = kind === 'invoice' ? `/api/orders/${orderId}/send-invoice-sms` : `/api/orders/${orderId}/send-receipt-sms`;

  const subject = useMemo(() => {
    return `${title} From Payoff Solar — Order #${orderId.substring(0, 8)}`;
  }, [title, orderId]);

  const bodyPreview = useMemo(() => {
    return `A link to your ${title.toLowerCase()} is included below. A PDF copy will also be attached.`;
  }, [title]);

  const sendEmail = async () => {
    if (!contactEmail) return;
    setSending(true);
    try {
      const res = await fetch(emailApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contactEmail, contactId, mode: 'pdf' })
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
              onClick={() => setShowEmail(true)}
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
              <div className="hidden">
                <div className="text-gray-500">To</div>
                <div className="text-gray-900">{contactEmail}</div>
              </div>
              <div>
                <div className="text-gray-500">Subject</div>
                <div className="text-gray-900">{subject}</div>
              </div>
              <div>
                <div className="text-gray-500">Body</div>
                <div className="text-gray-900">
                  <p>{bodyPreview}</p>
                  <p className="break-all text-green-700 mt-2">{viewHref}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowEmail(false)} className="px-3 py-2 text-sm rounded-md border">Cancel</button>
              <button onClick={sendEmail} disabled={sending} className="px-3 py-2 text-sm rounded-md bg-green-600 text-white disabled:opacity-50">Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

