'use client'

import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '../contexts/ThemeContext'
import type { RepositoryMetadata, LanguageData, AggregatedLanguageStats } from '@/types/repository-metadata'
import { getRepoMetadata } from '@/utils/repoMetadataClient'
import {
  getAggregatedStats,
  formatBytes,
} from '@/utils/language-calculations'

// ============================================================================
// INTERFACES
// ============================================================================

interface DiscoLanguageVisualizationProps {
  /** Pre-loaded repository data */
  repositories?: RepositoryMetadata[]
  /** Container height */
  height?: string
  /** Visual mode (inspired by DiscoBall lighting modes) */
  mode?: 'party' | 'chill' | 'ambient' | 'dramatic'
  /** Animation speed multiplier (0 = static) */
  rotationSpeed?: number
  /** Enable orbit controls */
  enableControls?: boolean
  /** Additional CSS classes */
  className?: string
}

interface LanguageTileProps {
  language: LanguageData
  phi: number
  theta: number
  radius: number
  size: number
  index: number
  mode: 'party' | 'chill' | 'ambient' | 'dramatic'
}

interface LanguageSphereProps {
  languages: LanguageData[]
  rotationSpeed: number
  mode: 'party' | 'chill' | 'ambient' | 'dramatic'
  themeColor: string
}

interface LightsProps {
  color: string
  mode: 'party' | 'chill' | 'ambient' | 'dramatic'
}

interface LightingConfig {
  ambientIntensity: number
  spotlights: Array<{
    position: [number, number, number]
    intensity: number
    angle: number
    penumbra: number
  }>
}

// ============================================================================
// LIGHTING CONFIGURATION (inspired by DiscoBall)
// ============================================================================

const getLightingConfig = (mode: 'party' | 'chill' | 'ambient' | 'dramatic'): LightingConfig => {
  switch (mode) {
    case 'party':
      return {
        ambientIntensity: 0.3,
        spotlights: [
          { position: [6, 6, 6], intensity: 2.5, angle: 0.4, penumbra: 1 },
          { position: [-6, 6, 6], intensity: 2.5, angle: 0.4, penumbra: 1 },
          { position: [0, 6, -6], intensity: 2.5, angle: 0.4, penumbra: 1 },
          { position: [0, -6, 0], intensity: 1.5, angle: 0.5, penumbra: 1 },
        ],
      }
    case 'chill':
      return {
        ambientIntensity: 0.5,
        spotlights: [
          { position: [6, 6, 6], intensity: 1.2, angle: 0.6, penumbra: 1.2 },
          { position: [-6, 6, 6], intensity: 1.2, angle: 0.6, penumbra: 1.2 },
        ],
      }
    case 'ambient':
      return {
        ambientIntensity: 0.8,
        spotlights: [
          { position: [0, 12, 0], intensity: 0.8, angle: 0.8, penumbra: 1.5 },
        ],
      }
    case 'dramatic':
      return {
        ambientIntensity: 0.15,
        spotlights: [
          { position: [10, 10, 10], intensity: 4, angle: 0.25, penumbra: 0.8 },
          { position: [0, -10, 0], intensity: 2, angle: 0.35, penumbra: 0.9 },
        ],
      }
  }
}

// ============================================================================
// LANGUAGE TILE COMPONENT (individual mirror tile on sphere)
// ============================================================================

function LanguageTile({ language, phi, theta, radius, size, index, mode }: LanguageTileProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // Calculate position on sphere
  const position = useMemo(() => {
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    return new THREE.Vector3(x, y, z)
  }, [phi, theta, radius])

  // Animation for shimmer effect
  useFrame((state) => {
    if (meshRef.current) {
      // Orient the tile to face the center of the sphere
      meshRef.current.lookAt(0, 0, 0)
      
      if (mode === 'party') {
        // Subtle shimmer effect
        const shimmer = Math.sin(state.clock.elapsedTime * 2 + index * 0.5) * 0.1 + 0.9
        meshRef.current.scale.setScalar(hovered ? 1.2 : shimmer)
      }
    }
  })

  // Get metalness based on mode
  const metalness = mode === 'party' ? 0.95 : mode === 'dramatic' ? 0.9 : 0.7
  const roughness = mode === 'party' ? 0.05 : mode === 'dramatic' ? 0.1 : 0.2

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color={language.color}
        metalness={metalness}
        roughness={roughness}
        envMapIntensity={hovered ? 2 : 1.2}
        emissive={language.color}
        emissiveIntensity={hovered ? 0.3 : mode === 'party' ? 0.1 : 0}
      />
    </mesh>
  )
}

// ============================================================================
// LANGUAGE SPHERE COMPONENT (main 3D visualization)
// ============================================================================

function LanguageSphere({ languages, rotationSpeed, mode, themeColor }: LanguageSphereProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Rotate the sphere
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed
      // Add subtle wobble for "party" effect
      if (mode === 'party') {
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      }
    }
  })

  // Create tiles based on language distribution
  const tiles = useMemo(() => {
    const result: React.JSX.Element[] = []
    const radius = 3

    // Calculate total tiles based on language distribution
    // Each language gets tiles proportional to its percentage
    let tileIndex = 0
    
    languages.forEach((lang) => {
      // Calculate number of tiles for this language (proportional to percentage)
      const minTiles = 1
      const maxTilesPerLang = 50
      const tileCount = Math.max(minTiles, Math.round((lang.percentage / 100) * maxTilesPerLang * 4))
      
      for (let i = 0; i < tileCount; i++) {
        // Distribute tiles across the sphere using golden ratio for even spacing
        const goldenRatio = (1 + Math.sqrt(5)) / 2
        const phi = Math.acos(1 - 2 * (tileIndex + 0.5) / (languages.length * 40 + tileIndex))
        const theta = 2 * Math.PI * tileIndex / goldenRatio
        
        // Size based on percentage (larger languages = larger tiles)
        const tileSize = 0.15 + (lang.percentage / 100) * 0.2
        
        result.push(
          <LanguageTile
            key={`tile-${lang.name}-${i}`}
            language={lang}
            phi={phi}
            theta={theta}
            radius={radius}
            size={tileSize}
            index={tileIndex}
            mode={mode}
          />
        )
        tileIndex++
      }
    })
    
    return result
  }, [languages, mode])

  return (
    <group ref={groupRef}>
      {/* Core sphere (glowing center) */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial
          color={themeColor}
          metalness={0.3}
          roughness={0.7}
          transparent
          opacity={0.4}
          emissive={themeColor}
          emissiveIntensity={mode === 'party' ? 0.5 : mode === 'dramatic' ? 0.8 : 0.2}
        />
      </mesh>
      
      {/* Language tiles */}
      {tiles}
    </group>
  )
}

// ============================================================================
// LIGHTS COMPONENT
// ============================================================================

function Lights({ color, mode }: LightsProps) {
  const config = getLightingConfig(mode)
  
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
          castShadow
        />
      ))}
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DiscoLanguageVisualization({
  repositories,
  height = '400px',
  mode = 'party',
  rotationSpeed = 0.3,
  enableControls = true,
  className = ''
}: DiscoLanguageVisualizationProps) {
  const { colorValue } = useTheme()
  const [fetchedRepos, setFetchedRepos] = useState<RepositoryMetadata[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentMode, setCurrentMode] = useState(mode)

  // Pre-loaded repositories win; otherwise load the shared static JSON
  useEffect(() => {
    if (repositories) return
    let ignore = false
    getRepoMetadata()
      .then(data => {
        if (!ignore) setFetchedRepos(data)
      })
      .catch(err => {
        console.error('Error loading repository metadata:', err)
        if (!ignore) setError(err instanceof Error ? err.message : 'Unknown error')
      })
    return () => {
      ignore = true
    }
  }, [repositories])

  const repoData = repositories ?? fetchedRepos
  const loading = !repoData && !error

  // Calculate aggregated statistics
  const stats: AggregatedLanguageStats | null = useMemo(
    () => (repoData && repoData.length > 0 ? getAggregatedStats(repoData, true) : null),
    [repoData]
  )

  const modes: Array<{ id: 'party' | 'chill' | 'ambient' | 'dramatic', label: string, emoji: string }> = [
    { id: 'party', label: 'Party', emoji: '🎉' },
    { id: 'chill', label: 'Chill', emoji: '😎' },
    { id: 'ambient', label: 'Ambient', emoji: '🌙' },
    { id: 'dramatic', label: 'Dramatic', emoji: '🎭' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" style={{ height }}>
        <div className="space-y-2 text-center">
          <div 
            className="mx-auto size-16 animate-spin rounded-full border-4 border-transparent"
            style={{ borderTopColor: colorValue, borderRightColor: colorValue }}
          />
          <div className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
            Loading repository data...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8" style={{ height }}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="font-google-sans-code text-red-600 dark:text-red-400">
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    )
  }

  if (!stats?.languages?.length) {
    return (
      <div className="flex items-center justify-center p-8" style={{ height }}>
        <div className="font-google-sans-code text-gray-600 dark:text-gray-400">No language data available</div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-google-sans-code text-lg font-bold text-gray-900 dark:text-white">
            UNPARTY Code Universe
          </h3>
          <p className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
            {stats.languageCount} languages • {stats.totalRepositories} repos • {formatBytes(stats.totalBytes)}
          </p>
        </div>
        
        {/* Mode selector */}
        <div className="flex gap-2">
          {modes.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => setCurrentMode(id)}
              className={`rounded-lg px-3 py-1.5 font-google-sans-code text-xs transition-all duration-300 ${
                currentMode === id
                  ? 'text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              style={currentMode === id ? { backgroundColor: colorValue } : {}}
            >
              <span className="mr-1">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Visualization */}
      <div 
        className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ height }}
      >
        <Canvas 
          camera={{ position: [0, 0, 10], fov: 50 }}
          style={{ background: currentMode === 'dramatic' ? '#000' : currentMode === 'party' ? '#0a0a0f' : '#111' }}
        >
          <Lights color={colorValue} mode={currentMode} />
          <LanguageSphere 
            languages={stats.languages}
            rotationSpeed={rotationSpeed}
            mode={currentMode}
            themeColor={colorValue}
          />
          
          {/* Environment map for reflections */}
          <Environment preset="night" />
          
          {/* Camera controls */}
          {enableControls && (
            <OrbitControls
              enableZoom={true}
              enablePan={true}
              minDistance={5}
              maxDistance={20}
              autoRotate={currentMode === 'party'}
              autoRotateSpeed={0.5}
            />
          )}
        </Canvas>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
        {stats.languages.slice(0, 12).map((lang, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 rounded-lg bg-gray-100 p-2 font-google-sans-code text-xs dark:bg-black/20"
          >
            <div
              className="size-3 rounded-sm flex-shrink-0"
              style={{ 
                backgroundColor: lang.color,
                boxShadow: `0 0 8px ${lang.color}40`
              }}
            />
            <span className="truncate text-gray-900 dark:text-white">{lang.name}</span>
            <span className="ml-auto text-gray-500">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
