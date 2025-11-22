import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-blue-900 font-bold ml-2">{label}</label>}
      <input 
        className={`w-full px-6 py-3 rounded-2xl border-4 border-blue-200 bg-white text-blue-900 font-bold placeholder-blue-300 focus:outline-none focus:border-blue-400 transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};
