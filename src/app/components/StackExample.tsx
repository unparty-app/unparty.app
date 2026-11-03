'use client';

import { VStack, HStack, ZStack } from './Stacks';
import { useTheme } from '../contexts/ThemeContext';

const Box = ({ color, size = '60px', children }: { color: string; size?: string; children?: React.ReactNode }) => (
  <div 
    className="flex items-center justify-center rounded-lg font-bold text-white"
    style={{ 
      backgroundColor: color,
      width: size,
      height: size,
    }}
  >
    {children}
  </div>
);

const StackExample = () => {
  const { allColors } = useTheme();
  
  return (
    <VStack spacing={40} className="w-full">
      {/* VStack Example */}
      <div>
        <h3 className="mb-4 font-google-sans-code text-lg">VStack Example</h3>
        <VStack spacing={8} alignment="center" className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <Box color={allColors.electricPurple}>1</Box>
          <Box color={allColors.electricBlue}>2</Box>
          <Box color={allColors.electricGreen}>3</Box>
        </VStack>
      </div>

      {/* HStack Example */}
      <div>
        <h3 className="mb-4 font-google-sans-code text-lg">HStack Example</h3>
        <HStack spacing={8} alignment="center" className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <Box color={allColors.brand}>A</Box>
          <Box color={allColors.pushblack}>B</Box>
          <Box color={allColors.healpurple}>C</Box>
        </HStack>
      </div>

      {/* ZStack Example */}
      <div>
        <h3 className="mb-4 font-google-sans-code text-lg">ZStack Example</h3>
        <ZStack width="200px" height="200px" className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <Box color={`${allColors.electricPurple}30`} size="180px">Back</Box>
          <Box color={`${allColors.electricBlue}50`} size="140px">Middle</Box>
          <Box color={`${allColors.brand}70`} size="100px">Front</Box>
        </ZStack>
      </div>
    </VStack>
  );
};

export default StackExample;