'use client';

import Image from 'next/image';

interface IconButtonProps {
  icon: string;
  onClick: () => void;
  label: string;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  onClick, 
  label, 
  className = '' 
}) => {
  // Enhanced base classes with visual hierarchy
  const buttonBaseClasses = 'size-6 flex items-center justify-center vh-secondary-interactive rounded-md';
  
  return (
    <button
      onClick={onClick}
      className={`${buttonBaseClasses} hover:text-blue-500 ${className}`}
      aria-label={label}
      title={label}
    >
      {icon ? (
        <Image
          src={`/svgs/user_set/${icon}`}
          alt=""
          width={20}
          height={20}
          unoptimized
          className={`vh-supporting-element size-5 ${className}`}
        />
      ) : (
        <span className="vh-supporting-element text-sm">⚙️</span>
      )}
    </button>
  );
};

export default IconButton;