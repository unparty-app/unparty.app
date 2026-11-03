"use client";

import PageMedia from './PageMedia';
import PageTable from './PageTable';

interface PageRowProps {
  className?: string;
}

const PageRow = ({ className = '' }: PageRowProps) => {
  return (
    <div className={`w-full ${className} flex items-end`} style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Compact two-column layout - much less prominent */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Compact 4x3 grid */}
        <div>
          
          <PageMedia />
        </div>
        
        {/* Right: Simple table */}
        <div>
          <h4 className="mb-3 font-vt323 text-sm font-medium" 
              style={{ color: 'var(--text-muted)' }}>
            
          </h4>
          <PageTable />
         
        </div>
      </div>
    </div>
  );
};

export default PageRow;