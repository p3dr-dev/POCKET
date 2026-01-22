'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export default function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200/60 dark:bg-gray-800/40";
  
  const variantClasses = {
    rect: "rounded-2xl",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full"
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      aria-hidden="true"
    />
  );
}
