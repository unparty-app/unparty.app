"use client";
import { useTheme } from "../contexts/ThemeContext";


interface AboutProps {
  activeView?: string;
}

const About: React.FC<AboutProps> = ({ activeView = 'overview' }) => {
  const { colorValue } = useTheme();
  
  const renderMissionContent = () => (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 p-8 " style={{color:colorValue}}>
        <h2 className="mb-6 font-google-sans-code text-3xl font-bold" style={{ color: colorValue }}>HOW IT WORKS.</h2>
        <p className="mb-6 font-google-sans-code text-xl leading-relaxed">
          <span style={{ color: colorValue }} className="font-semibold">add</span> STORY. <strong style={{ color: colorValue }}>📮</strong>
        </p>
      </div>
    </div>
  );

  const renderProcessContent = () => (
    <div className="space-y-6">
      <h2 className="mb-8 font-google-sans-code text-3xl font-bold" style={{ color: colorValue }}>THREE-STEPS</h2>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:bg-gray-100 dark:border-gray-700 dark:bg-black/10 dark:hover:bg-black/20">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-current text-sm font-bold" style={{ borderColor: colorValue, color: colorValue }}>01</div>
            <h3 className="font-google-sans-code text-lg font-bold" style={{ color: colorValue }}>ABOUT</h3>
          </div>
          <p className="font-google-sans-code leading-relaxed text-gray-600 dark:text-gray-300">
            thinking.
          </p>
        </div>
        
        <div className="group rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:bg-gray-100 dark:border-gray-700 dark:bg-black/10 dark:hover:bg-black/20">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-current text-sm font-bold" style={{ borderColor: colorValue, color: colorValue }}>02</div>
            <h3 className="font-google-sans-code text-lg font-bold" style={{ color: colorValue }}>BUILD</h3>
          </div>
          
        </div>
        
        <div className="group rounded-xl border border-gray-200  p-6 transition-all hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-black/20">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-current text-sm font-bold" style={{ borderColor: colorValue, color: colorValue }}>03</div>
            <h3 className="font-google-sans-code text-lg font-bold" style={{ color: colorValue }}>CONNECT</h3>
          </div>
          
        </div>
      </div>
    </div>
  );

  const renderOverviewContent = () => (
    <div className="space-y-8">
      {/* Hero Statement */}
      <div className="rounded-xl border border-gray-200  p-8 dark:border-gray-700">
        <h2 className="mb-6 font-google-sans-code text-3xl font-bold" style={{ color: colorValue }}>thinking...</h2>
        <p className="mb-6 font-google-sans-code text-xl leading-relaxed">
          <span style={{ color: colorValue }} className="font-semibold">🧠</span> 
        
        </p>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        
        
        
        
        
        
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {activeView === 'mission' && renderMissionContent()}
      {activeView === 'process' && renderProcessContent()}
      {activeView === 'overview' && renderOverviewContent()}
    </div>
  );
};

export default About;