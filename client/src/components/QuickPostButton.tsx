import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import QuickPostModal from './QuickPostModal';
import { Mic } from 'lucide-react';

export default function QuickPostButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        variant="default" 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => setIsModalOpen(true)}
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