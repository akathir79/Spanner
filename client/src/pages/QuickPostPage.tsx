import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import QuickPostModal from '@/components/QuickPostModal';

export default function QuickPostPage() {
  const [, setLocation] = useLocation();
  
  // Always redirect to home with modal open instead of showing full page
  useEffect(() => {
    // Redirect to home and trigger modal
    setLocation('/');
    // Small delay to ensure page loads, then trigger modal
    setTimeout(() => {
      const event = new CustomEvent('openQuickPostModal');
      window.dispatchEvent(event);
    }, 100);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Opening Quick Post...</p>
      </div>
    </div>
  );
}