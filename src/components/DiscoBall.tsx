'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../app/contexts/ThemeContext';

// TypeScript interfaces
interface DiscoBallSceneProps {
  color?: string;              // Primary color for base sphere and lights
  tileColor?: string;          // Mirror tile color
  size?: 'small' | 'medium' | 'large';  // Size variant
  rotationSpeed?: number;      // Animation speed multiplier (0 = static)
  lightingMode?: 'party' | 'chill' | 'ambient' | 'dramatic';
  height?: string;             // Container height
  className?: string;          // Additional CSS classes
  enableControls?: boolean;    // Enable orbit controls
}

interface DiscoBallMeshProps {
  color: string;
  tileColor: string;
  size: 'small' | 'medium' | 'large';
  rotationSpeed: number;
}

interface LightsProps {
  color: string;
  mode: 'party' | 'chill' | 'ambient' | 'dramatic';
}

interface LightingConfig {
  ambientIntensity: number;
  spotlights: Array<{
    position: [number, number, number];
    intensity: number;
    angle: number;
    penumbra: number;
  }>;
}

// Lighting mode presets
const getLightingConfig = (mode: 'party' | 'chill' | 'ambient' | 'dramatic'): LightingConfig => {
  switch (mode) {
    case 'party':
      return {
        ambientIntensity: 0.2,
        spotlights: [
          { position: [5, 5, 5], intensity: 2, angle: 0.3, penumbra: 1 },
          { position: [-5, 5, 5], intensity: 2, angle: 0.3, penumbra: 1 },
          { position: [0, 5, -5], intensity: 2, angle: 0.3, penumbra: 1 },
          { position: [0, -5, 0], intensity: 1, angle: 0.5, penumbra: 1 },
        ],
      };
    case 'chill':
      return {
        ambientIntensity: 0.4,
        spotlights: [
          { position: [5, 5, 5], intensity: 1, angle: 0.9, penumbra: 1.2 },
          { position: [-5, 5, 5], intensity: 1, angle: 0.4, penumbra: 1.2 },
        ],
      };
    case 'ambient':
      return {
        ambientIntensity: 0.8,
        spotlights: [
          { position: [0, 10, 0], intensity: 0.5, angle: 0.6, penumbra: 1.5 },
        ],
      };
    case 'dramatic':
      return {
        ambientIntensity: 0.1,
        spotlights: [
          { position: [8, 8, 8], intensity: 3, angle: 0.2, penumbra: 0.8 },
          { position: [0, -8, 0], intensity: 1.5, angle: 0.3, penumbra: 0.9 },
        ],
      };
  }
};

// Size configurations
const getSizeConfig = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return { radius: 1.5, baseRadius: 1.45, tileSize: 0.12, rows: 16, cols: 32 };
    case 'large':
      return { radius: 2.5, baseRadius: 2.45, tileSize: 0.18, rows: 24, cols: 48 };
    case 'medium':
    default:
      return { radius: 2, baseRadius: 1.95, tileSize: 0.15, rows: 20, cols: 40 };
  }
};

// Disco Ball Component
function DiscoBallMesh({ color, tileColor, size, rotationSpeed }: DiscoBallMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const sizeConfig = getSizeConfig(size);

  // Rotate the disco ball
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  // Create mirror tiles geometry
  const createMirrorTiles = () => {
    const tiles: React.JSX.Element[] = [];
    const { rows, cols, radius, tileSize } = sizeConfig;

    for (let i = 0; i < rows; i++) {
      const phi = (Math.PI * i) / rows;
      for (let j = 0; j < cols; j++) {
        const theta = (2 * Math.PI * j) / cols;
        
        // Calculate position on sphere
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        // Calculate normal for orientation
        const normal = new THREE.Vector3(x, y, z).normalize();
        
        // Create a slight offset for the tiles
        const position = normal.multiplyScalar(radius);

        tiles.push(
          <mesh
            key={`tile-${i}-${j}`}
            position={[position.x, position.y, position.z]}
          >
            <sphereGeometry args={[tileSize / 2, 12, 12]} />
            <meshStandardMaterial
              color={tileColor}
              metalness={1}
              roughness={0.1}
              envMapIntensity={1}
            />
          </mesh>
        );
      }
    }
    return tiles;
  };

  return (
    <group ref={groupRef}>
      {/* Base sphere (optional, for gaps between tiles) */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[sizeConfig.baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      
      {/* Mirror tiles */}
      {createMirrorTiles()}
    </group>
  );
}

// Lights Component
function Lights({ color, mode }: LightsProps) {
  const config = getLightingConfig(mode);
  
  return (
    <>
      <ambientLight intensity={config.ambientIntensity} />
      {config.spotlights.map((light, index) => (
        <spotLight
          key={`spotlight-${index}`}
          position={light.position}
          angle={light.angle}
          penumbra={light.penumbra}
          intensity={light.intensity}
          color={color}
        />
      ))}
    </>
  );
}

// Main Disco Ball Scene Component
export default function DiscoBallScene({
  color,
  tileColor = '#ffffff',
  size = 'medium',
  rotationSpeed = 0.5,
  lightingMode = 'party',
  height = '30vh',
  className = '',
  enableControls = true,
}: DiscoBallSceneProps = {}) {
  // Integrate with theme system
  const { colorValue } = useTheme();
  const finalColor = color || colorValue;

  return (
    <div 
      className={className}
      style={{ width: '100%', height }}
    >
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Lights color={finalColor} mode={lightingMode} />
        <DiscoBallMesh 
          color={finalColor}
          tileColor={tileColor}
          size={size}
          rotationSpeed={rotationSpeed}
        />
        
        {/* Environment map for reflections */}
        <Environment preset="night" />
        
        {/* Camera controls */}
        {enableControls && (
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            minDistance={4}
            maxDistance={15}
          />
        )}
      </Canvas>
    </div>
  );
}
