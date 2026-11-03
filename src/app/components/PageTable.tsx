"use client";

import Image from 'next/image';
import CoverAssetMapper from '../../utils/CoverAssetMapper';

const PageTable = () => {
  // Get unique asset mappings for the table
  const assetMappings = CoverAssetMapper.getValidMappings();
  
  // Get unique assets to avoid duplicates in table
  const uniqueAssets = assetMappings.filter((mapping, index, self) => 
    index === self.findIndex(m => m.iconFileName === mapping.iconFileName)
  );

  return (
    <div className="w-full">
      {/* Compact table matching left column height */}
      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/20 dark:border-gray-700/20">
              <th className="py-2 pl-0 pr-3 text-left">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                      style={{ color: 'var(--text-muted)' }}>
                  CROWD
                </span>
              </th>
              <th className="py-2 px-3 text-left">
                <span className="font-google-sans-code text-xs uppercase tracking-wide" 
                      style={{ color: 'var(--text-muted)' }}>
                  PARTY
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {uniqueAssets.slice(0, 3).map((mapping) => (
              <tr 
                key={mapping.iconFileName}
                className="border-b border-gray-200/10 dark:border-gray-700/10 transition-colors duration-200 hover:bg-gray-50/20 dark:hover:bg-white/5"
              >
                {/* Icon column */}
                <td className="py-2 pl-0 pr-3">
                  {mapping.iconPath && (
                    <div className="relative size-6">
                      <Image
                        src={mapping.iconPath}
                        alt={mapping.asset?.name || mapping.iconFileName}
                        width={24}
                        height={24}
                        className="size-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                </td>
                
                {/* Title column */}
                <td className="py-2 px-3">
                  <span className="font-google-sans-code text-sm" 
                        style={{ color: 'var(--foreground)' }}>
                    {mapping.title}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PageTable;