import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "transform transition-all duration-150 active:scale-95 font-bold rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px] px-6 py-3 text-lg md:text-xl flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-400 border-b-4 border-blue-700",
    secondary: "bg-yellow-400 text-yellow-900 hover:bg-yellow-300 border-b-4 border-yellow-600",
    danger: "bg-pink-500 text-white hover:bg-pink-400 border-b-4 border-pink-700",
    success: "bg-green-500 text-white hover:bg-green-400 border-b-4 border-green-700",
    outline: "bg-white text-gray-600 border-2 border-gray-300 shadow-none hover:bg-gray-50",
  };

  const disabledStyle = "opacity-50 cursor-not-allowed pointer-events-none grayscale";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? disabledStyle : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;