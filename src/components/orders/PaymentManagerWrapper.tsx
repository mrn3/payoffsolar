'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PaymentManager from './PaymentManager';
import { Payment } from '@/lib/models';

interface PaymentManagerWrapperProps {
  orderId: string;
  payments: Payment[];
  orderTotal: number;
}

export default function PaymentManagerWrapper({ orderId, payments, orderTotal }: PaymentManagerWrapperProps) {
  const router = useRouter();

  const handlePaymentsChange = () => {
    router.refresh();
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

