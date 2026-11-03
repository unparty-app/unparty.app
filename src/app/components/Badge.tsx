interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'header';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export default function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  style = {}
}: BadgeProps) {
  const getBaseClasses = () => {
    if (variant === 'header') {
      return 'rounded-md border font-vt323 font-normal tracking-normal';
    }
    return 'vh-supporting-element-brand rounded-md border font-[\'Brandon-Grotesque\'] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-[#F9C22E] hover:text-white/75 cursor-pointer';
  };
  
  const variantClasses = {
    primary: 'border-[#F9C22E]',
    secondary: 'border-gray-300',
    header: 'border-[#F9C22E]'
  };
  
  const sizeClasses = {
    sm: 'px-1 py-0.5 text-xs',
    md: 'px-1.5 py-0.5 text-xs sm:px-2 sm:py-0.5 sm:text-sm',
    lg: 'px-2 py-0.5 text-sm sm:px-2.5 sm:py-1 sm:text-base'
  };
  
  const getColorStyle = () => {
    if (variant === 'header') {
      return { color: 'var(--text-muted)' };
    }
    return variant === 'primary' ? { color: '#F9C22E' } : { color: 'var(--foreground)' };
  };
  
  return (
    <span 
      className={`${getBaseClasses()} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{ ...getColorStyle(), ...style }}
    >
      {children}
    </span>
  );
}