'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PaymentManager from './PaymentManager';
import { Payment } from '@/lib/models';

interface PaymentManagerWrapperProps {
  orderId: string;
  payments: Payment[];
  orderTotal: number;
  /** Optional: custom callback when payments change (e.g. for client pages that manage their own state). If not provided, uses router.refresh(). */
  onPaymentsChange?: () => void | Promise<void>;
}

export default function PaymentManagerWrapper({ orderId, payments, orderTotal, onPaymentsChange }: PaymentManagerWrapperProps) {
  const router = useRouter();

  const handlePaymentsChange = () => {
    if (onPaymentsChange) {
      void onPaymentsChange();
    } else {
      router.refresh();
    }
  };

  return (
    <PaymentManager
      orderId={orderId}
      payments={payments}
      orderTotal={orderTotal}
      onPaymentsChange={handlePaymentsChange}
    />
  );
}

