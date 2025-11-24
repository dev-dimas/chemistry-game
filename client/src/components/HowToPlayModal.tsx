import React from 'react';
import { useLanguageStore } from '../stores/languageStore';
import { Button } from './Button';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguageStore();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-4 border-blue-200 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-6 border-b-2 border-gray-100 pb-4">
           <h2 className="text-2xl font-black text-blue-600">{t.rulesTitle}</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>
        
        <div className="space-y-4 mb-8">
            <p className="text-gray-700 font-medium">{t.rule1}</p>
            <p className="text-gray-700 font-medium">{t.rule2}</p>
            <p className="text-gray-700 font-medium">{t.rule3}</p>
            <p className="text-gray-700 font-medium">{t.rule4}</p>
        </div>

        <div className="flex justify-end">
            <Button onClick={onClose}>{t.close}</Button>
        </div>
      </div>
    </div>
  );
};
