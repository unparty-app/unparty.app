'use client';

import { useBusinessWorksheetModal } from '../hooks/useBusinessWorksheetModal';
import Badge from '../components/Badge';

import { DollarSign, TrendingUp, Lightbulb, Palette, Package, ShieldCheck } from '@/app/components/icons';

export default function BusinessWorksheetTestPage() {
  const { openModal, BusinessWorksheetModal } = useBusinessWorksheetModal();

  const categories = [
    { id: 'budget', label: 'BUDGET', icon: DollarSign, color: '#10B981', description: 'Financial planning and cost management' },
    { id: 'brand', label: 'BRAND', icon: Palette, color: '#F59E0B', description: 'Brand identity and legal protection' },
    { id: 'product', label: 'PRODUCT', icon: Package, color: '#8B5CF6', description: 'Quality control and scalability' },
    { id: 'risk', label: 'RISK', icon: ShieldCheck, color: '#EF4444', description: 'Legal structure and risk mitigation' },
    { id: 'grow', label: 'GROW', icon: TrendingUp, color: '#06B6D4', description: 'Growth strategies and expansion' },
    { id: 'core', label: 'CORE', icon: Lightbulb, color: '#F9C22E', description: 'Vision and strategic direction' }
  ];

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 
            className="text-lg font-bold mb-4"
            style={{ 
              color: 'var(--foreground)',
              fontFamily: "'font-vt323', sans-serif"
            }}
          >
            DEMO.
          </h1>
          <p className="text-md font-google-sans-code" style={{ color: 'var(--text-muted)' }}>
            ALWAYS GOOD TO START WITH A PLAN
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'rgba(249, 194, 46, 0.1)',
              borderColor: 'rgba(249, 194, 46, 0.3)'
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              🎨 CUSTOM STYLING 
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ultra-sleek design with brand-consistent visual hierarchy
            </p>
          </div>

          <div 
            className="p-6 rounded-xl border"
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)'
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              🔒 PRIVACY FIRST 
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Privacy mode with encrypted storage and user control
            </p>
          </div>

         
        </div>

        {/* Category launch buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => openModal(category.id)}
                className="p-6 rounded-xl border transition-all duration-200 hover:shadow-lg group"
                style={{ 
                  backgroundColor: `${category.color}10`,
                  borderColor: `${category.color}30`
                }}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: category.color }} />
                  </div>
                  <Badge variant="primary" size="sm">
                    {category.label}
                  </Badge>
                </div>
                <h3 
                  className="font-semibold text-left mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  {category.label} Questions
                </h3>
                <p 
                  className="text-sm text-left"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Global launch button */}
        <div className="text-center">
          <button
            onClick={() => openModal()}
            className="px-8 py-4 rounded-xl bg-[#F9C22E] text-white font-semibold text-lg transition-all duration-200 hover:bg-[#F9C22E]/90 hover:scale-105 shadow-lg"
            style={{ fontFamily: "'Brandon-Grotesque', sans-serif" }}
          >
           START DEMO
          </button>
        </div>

        {/* Implementation notes */}
        <div className="mt-16 p-6 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--text-muted)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            🛠 PREVIEW NOTES 
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <li>✅ Privacy mode with local stroage</li>
            <li>✅ Category-based navigation with progress indicators</li>
            <li>✅ Multiple question types (text, multiple choice, ranking)</li>
          </ul>
        </div>
      </div>

      {BusinessWorksheetModal}
    </div>
  );
}
