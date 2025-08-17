import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import QuickPostModal from './QuickPostModal';
import { Mic } from 'lucide-react';

export default function QuickPostButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Listen for custom event to open modal (from direct URL access)
  useEffect(() => {
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('openQuickPostModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openQuickPostModal', handleOpenModal);
    };
  }, []);

  return (
    <>
      <Button 
        variant="default" 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => setIsModalOpen(true)}
        data-testid="quick-post-btn"
      >
        <Mic className="w-4 h-4 mr-2" />
        Quick Post
      </Button>
      
      <QuickPostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}