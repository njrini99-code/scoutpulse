import { useState } from 'react';
import { Plus } from 'lucide-react';
import { QuickLogModal } from './QuickLogModal';

export function QuickLogFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-110 z-40 flex items-center justify-center group"
        aria-label="Quick Log Activity"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
      </button>

      <QuickLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
