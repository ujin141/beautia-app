import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export function GradientButton({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className,
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const sizeStyles = "h-[52px] px-8 text-[16px]";
  
  const variants = {
    primary: "bg-blur-gradient text-white shadow-sm hover:shadow-md hover:opacity-90 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]",
    secondary: "bg-surface text-primary hover:bg-line",
    outline: "border border-line bg-transparent text-primary hover:bg-surface",
    ghost: "bg-transparent text-secondary hover:text-primary",
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
