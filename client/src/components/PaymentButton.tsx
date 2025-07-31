import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { CreditCard } from 'lucide-react';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  isDisabled?: boolean;
  className?: string;
}

export function PaymentButton({ bookingId, amount, isDisabled = false, className }: PaymentButtonProps) {
  const [, navigate] = useLocation();

  const handlePaymentClick = () => {
    navigate(`/payment/${bookingId}`);
  };

  return (
    <Button 
      onClick={handlePaymentClick}
      disabled={isDisabled}
      className={className}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      Pay ₹{amount.toFixed(2)}
    </Button>
  );
}