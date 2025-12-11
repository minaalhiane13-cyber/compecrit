import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all transform active:scale-95 shadow-lg border-b-4";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-400 text-white border-blue-700",
    secondary: "bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-yellow-600",
    danger: "bg-red-500 hover:bg-red-400 text-white border-red-700",
    success: "bg-green-500 hover:bg-green-400 text-white border-green-700",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};
