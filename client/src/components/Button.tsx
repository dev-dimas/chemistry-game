import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-6 py-3 rounded-full font-bold text-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all transform";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-400 text-white border-b-4 border-blue-700",
    secondary: "bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-b-4 border-yellow-600",
    danger: "bg-red-500 hover:bg-red-400 text-white border-b-4 border-red-700",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
