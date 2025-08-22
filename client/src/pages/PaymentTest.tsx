import { useEffect } from 'react';
import SimpleRazorpay from '@/components/SimpleRazorpay';

export default function PaymentTest() {
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script when component unmounts
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the simple Razorpay integration
          </p>
        </div>
        <SimpleRazorpay />
      </div>
    </div>
  );
}