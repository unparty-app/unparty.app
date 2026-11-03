
interface HopeProps {
  children?: React.ReactNode;
  className?: string;
}

const Hope: React.FC<HopeProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-left font-google-sans-code font-light ${className}`}>
      {children}
    </div>
  );
};

export default Hope;