import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-md border-4 border-white rounded-[3rem] shadow-xl p-6 md:p-10 ${className}`}>
      {children}
    </div>
  );
};

export default Card;