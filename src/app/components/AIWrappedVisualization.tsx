'use client'

import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '../contexts/ThemeContext'

// ============================================================================
// TYPES
// ============================================================================

type Mode = 'total' | 'hourly' | 'timeline' | 'peaks' | 'radar'

interface HourlyBucket {
  hour: number
  chatgpt: number
  claude: number
  total: number
}

interface DayBucket {
  date: string
  chatgpt: number
  claude: number
}

interface Launch {
  date: string
  name: string
}

interface Analytics {
  summary: {
    total: number
    chatgpt: number
    claude: number
    dateRange: { start: string; end: string }
    spanDays: number
  }
  hourly: HourlyBucket[]
  topDays: DayBucket[]
  weekday: { day: string; chatgpt: number; claude: number }[]
  daily: DayBucket[]
  launches: Launch[]
}

// ============================================================================
// COLORS
// ============================================================================

const GOLD = '#F9C22E'
const CYAN = '#00FFFF'
const MAGENTA = '#FF00FF'

// ============================================================================
// TOTAL SCENE — two orbiting spheres proportional to conversation count
// ============================================================================

function TotalScene({ data }: { data: Analytics }) {
  const { colorValue } = useTheme()
  const gptRef = useRef<THREE.Mesh>(null)
  const claudeRef = useRef<THREE.Mesh>(null)

  const total = data.summary.total
  const gptFrac = data.summary.chatgpt / total
  const claudeFrac = data.summary.claude / total
  const gptR = 0.8 + gptFrac * 1.2
  const claudeR = 0.8 + claudeFrac * 1.2

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (gptRef.current) {
      gptRef.current.position.x = Math.cos(t * 0.4) * 2.2
      gptRef.current.position.z = Math.sin(t * 0.4) * 2.2
    }
    if (claudeRef.current) {
      claudeRef.current.position.x = Math.cos(t * 0.4 + Math.PI) * 2.2
      claudeRef.current.position.z = Math.sin(t * 0.4 + Math.PI) * 2.2
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={3} color={GOLD} />
      <pointLight position={[-5, -5, -5]} intensity={2} color={CYAN} />

      {/* ChatGPT orb */}
      <mesh ref={gptRef}>
        <sphereGeometry args={[gptR, 32, 32]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.1} emissive={GOLD} emissiveIntensity={0.4} />
        <Html center distanceFactor={8}>
          <div className="text-center pointer-events-none">
            <div className="font-google-sans-code text-xs font-bold tracking-widest uppercase" style={{ color: CYAN }}>CHATGPT</div>
            <div className="font-vt323 text-2xl" style={{ color: CYAN }}>{data.summary.chatgpt.toLocaleString()}</div>
          </div>
        </Html>
      </mesh>

      {/* Claude orb */}
      <mesh ref={claudeRef}>
        <sphereGeometry args={[claudeR, 32, 32]} />
        <meshStandardMaterial color={CYAN} metalness={0.8} roughness={0.1} emissive={CYAN} emissiveIntensity={0.4} />
        <Html center distanceFactor={8}>
          <div className="text-center pointer-events-none">
            <div className="font-google-sans-code text-xs font-bold tracking-widest uppercase" style={{ color: colorValue }}>CLAUDE</div>
            <div className="font-vt323 text-2xl" style={{ color: colorValue }}>{data.summary.claude.toLocaleString()}</div>
          </div>
        </Html>
      </mesh>

      {/* Central total label */}
      <Html center position={[0, 0, 0]}>
        <div className="text-center pointer-events-none">
          <div className="font-google-sans-code text-xs tracking-widest uppercase opacity-60" style={{ color: 'var(--text-muted)' }}>TOTAL SESSIONS</div>
          <div className="font-vt323 text-4xl font-bold" style={{ color: colorValue }}>{total.toLocaleString()}</div>
          <div className="font-google-sans-code text-xs opacity-50" style={{ color: 'var(--text-muted)' }}>{data.summary.dateRange.start.slice(0, 7)} → {data.summary.dateRange.end.slice(0, 7)}</div>
        </div>
      </Html>
    </>
  )
}

// ============================================================================
// HOURLY SCENE — 24 cylinders in a ring
// ============================================================================

function HourlyBar({ bucket, index, maxTotal }: { bucket: HourlyBucket; index: number; maxTotal: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const angle = (index / 24) * Math.PI * 2
  const radius = 4
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const heightScale = (bucket.total / maxTotal) * 3
  const intensity = bucket.total / maxTotal
  const color = intensity > 0.7 ? MAGENTA : intensity > 0.4 ? GOLD : '#334477'

  useFrame((state) => {
    if (ref.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + index * 0.5) * 0.05 * intensity
      ref.current.scale.y = pulse
    }
  })

  return (
    <group position={[x, 0, z]} rotation={[0, -angle, 0]}>
      <mesh ref={ref} position={[0, heightScale / 2, 0]}>
        <cylinderGeometry args={[0.15, 0.2, heightScale || 0.05, 8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.5 * intensity} />
      </mesh>
      {bucket.total > 0 && (
        <Html position={[0, heightScale + 0.4, 0]} center>
          <div className="font-google-sans-code text-xs opacity-70 whitespace-nowrap pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            {bucket.hour.toString().padStart(2, '0')}h
          </div>
        </Html>
      )}
    </group>
  )
}

function HourlyScene({ data }: { data: Analytics }) {
  const groupRef = useRef<THREE.Group>(null)
  const maxTotal = Math.max(...data.hourly.map(h => h.total))

  useFrame((_s, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.08
  })

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 8, 0]} intensity={4} color={GOLD} />
      <pointLight position={[0, -4, 0]} intensity={2} color={CYAN} />
      <group ref={groupRef}>
        {data.hourly.map((bucket, i) => (
          <HourlyBar key={bucket.hour} bucket={bucket} index={i} maxTotal={maxTotal} />
        ))}
      </group>
    </>
  )
}

// ============================================================================
// TIMELINE SCENE — daily points plotted over time as a ribbon
// ============================================================================

function LaunchMarker({ x, name, colorValue }: { x: number; name: string; colorValue: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={[x, 0, 0]}>
      <mesh
        position={[0, 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.03, 0.03, 4, 6]} />
        <meshStandardMaterial
          color={colorValue} emissive={colorValue}
          emissiveIntensity={hovered ? 1 : 0.5}
          metalness={0.4} roughness={0.3}
          transparent opacity={hovered ? 1 : 0.65}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={colorValue} emissive={colorValue} emissiveIntensity={0.8} />
      </mesh>
      {hovered && (
        <Html position={[0, 4.6, 0]} center>
          <div
            className="font-google-sans-code text-xs whitespace-nowrap pointer-events-none px-2 py-1 rounded"
            style={{ color: colorValue, backgroundColor: 'var(--background)', border: `1px solid ${colorValue}40` }}
          >
            {name.replace('theunparty', '')}
          </div>
        </Html>
      )}
    </group>
  )
}

function TimelineScene({ data }: { data: Analytics }) {
  const { colorValue } = useTheme()
  const groupRef = useRef<THREE.Group>(null)
  const span = 12

  useFrame((_s, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.04
  })

  const { gptPoints, claudePoints } = useMemo(() => {
    const daily = data.daily
    const n = daily.length
    const maxCount = Math.max(...daily.map(d => Math.max(d.chatgpt, d.claude)), 1)
    const gptPoints: THREE.Vector3[] = daily.map((d, i) => new THREE.Vector3((i / (n - 1)) * span - span / 2, (d.chatgpt / maxCount) * 3, 0.3))
    const claudePoints: THREE.Vector3[] = daily.map((d, i) => new THREE.Vector3((i / (n - 1)) * span - span / 2, (d.claude / maxCount) * 3, -0.3))
    return { gptPoints, claudePoints }
  }, [data.daily])

  const launchMarkers = useMemo(() => {
    const daily = data.daily
    const n = daily.length
    const dateToIndex = new Map(daily.map((d, i) => [d.date, i]))
    return (data.launches ?? []).map(launch => {
      let idx = dateToIndex.get(launch.date)
      if (idx === undefined) {
        // nearest date by string compare
        idx = daily.reduce((best, d, i) =>
          Math.abs(d.date.localeCompare(launch.date)) < Math.abs(daily[best].date.localeCompare(launch.date)) ? i : best, 0)
      }
      return { x: (idx / (n - 1)) * span - span / 2, name: launch.name, date: launch.date }
    })
  }, [data.daily, data.launches])

  const gptCurve = useMemo(() => new THREE.CatmullRomCurve3(gptPoints), [gptPoints])
  const claudeCurve = useMemo(() => new THREE.CatmullRomCurve3(claudePoints), [claudePoints])
  const gptTubeGeom = useMemo(() => new THREE.TubeGeometry(gptCurve, 300, 0.04, 6, false), [gptCurve])
  const claudeTubeGeom = useMemo(() => new THREE.TubeGeometry(claudeCurve, 300, 0.04, 6, false), [claudeCurve])

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={3} color={GOLD} />
      <pointLight position={[0, -3, -5]} intensity={2} color={CYAN} />
      <group ref={groupRef}>
        <mesh geometry={gptTubeGeom}>
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.6} metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh geometry={claudeTubeGeom}>
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.6} metalness={0.5} roughness={0.2} />
        </mesh>
        {launchMarkers.map(m => (
          <LaunchMarker key={m.date + m.name} x={m.x} name={m.name} colorValue={colorValue} />
        ))}
        <Html position={[-6, 3.5, 0]}>
          <div className="font-google-sans-code text-xs pointer-events-none">
            <div style={{ color: CYAN }}>— ChatGPT</div>
            <div style={{ color: colorValue }}>— Claude</div>
            <div className="mt-1" style={{ color: colorValue }}>| launched</div>
          </div>
        </Html>
      </group>
    </>
  )
}

// ============================================================================
// PEAKS SCENE — top 10 days as vertical bars
// ============================================================================

function PeaksScene({ data }: { data: Analytics }) {
  const { colorValue } = useTheme()
  const [hovered, setHovered] = useState<number | null>(null)
  const maxCount = useMemo(() => Math.max(...data.topDays.map(d => d.chatgpt + d.claude)), [data.topDays])

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 8, 4]} intensity={4} color={GOLD} />
      <pointLight position={[0, -4, -4]} intensity={2} color={MAGENTA} />
      {data.topDays.map((day, i) => {
        const total = day.chatgpt + day.claude
        const h = (total / maxCount) * 4
        const x = (i - 4.5) * 1.1
        const isHovered = hovered === i
        const color = isHovered ? MAGENTA : i < 3 ? GOLD : CYAN

        return (
          <group key={day.date} position={[x, 0, 0]}>
            <mesh
              position={[0, h / 2, 0]}
              onPointerOver={() => setHovered(i)}
              onPointerOut={() => setHovered(null)}
            >
              <boxGeometry args={[0.7, h || 0.1, 0.7]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.15} emissive={color} emissiveIntensity={isHovered ? 0.8 : 0.4} />
            </mesh>
            <Html position={[0, h + 0.5, 0]} center>
              <div className="text-center pointer-events-none">
                <div className="font-vt323 text-sm opacity-90" style={{ color: 'var(--foreground)' }}>{total}</div>
                {isHovered && (
                  <div className="font-google-sans-code text-xs whitespace-nowrap" style={{ color: colorValue }}>{day.date}</div>
                )}
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}

// ============================================================================
// RADAR SCENE — 24-point polar chart of hourly consistency
// ============================================================================

function RadarScene({ data }: { data: Analytics }) {
  const { colorValue } = useTheme()
  const groupRef = useRef<THREE.Group>(null)
  const maxHour = Math.max(...data.hourly.map(h => h.total))

  useFrame((_s, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.06
  })

  const spokes = useMemo(() => {
    return data.hourly.map((h, i) => {
      const angle = (i / 24) * Math.PI * 2
      const r = 1.2 + (h.total / maxHour) * 2.8
      return {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        r,
        intensity: h.total / maxHour,
        hour: h.hour,
      }
    })
  }, [data.hourly, maxHour])

  // Build polygon ring geometry from spokes
  const ringPoints = useMemo(() => {
    const pts = spokes.map(s => new THREE.Vector3(s.x, s.y, 0))
    pts.push(pts[0])
    return pts
  }, [spokes])

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 8]} intensity={4} color={GOLD} />
      <pointLight position={[0, 0, -8]} intensity={2} color={MAGENTA} />
      <group ref={groupRef}>
        {/* Outer ring */}
        {ringPoints.slice(0, -1).map((pt, i) => {
          const next = ringPoints[i + 1]
          const mid = new THREE.Vector3().lerpVectors(pt, next, 0.5)
          const dist = pt.distanceTo(next)
          const angle = Math.atan2(next.y - pt.y, next.x - pt.x)
          const intensity = spokes[i].intensity
          const color = intensity > 0.7 ? MAGENTA : intensity > 0.4 ? GOLD : CYAN

          return (
            <mesh key={i} position={[mid.x, mid.y, 0]} rotation={[0, 0, angle]}>
              <boxGeometry args={[dist, 0.08 + intensity * 0.12, 0.08]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7 * intensity} metalness={0.5} roughness={0.2} />
            </mesh>
          )
        })}

        {/* Spokes */}
        {spokes.map((s, i) => (
          <mesh key={`spoke-${i}`} position={[s.x / 2, s.y / 2, 0]}>
            <boxGeometry args={[Math.sqrt(s.x * s.x + s.y * s.y), 0.03, 0.03]} />
            <meshStandardMaterial color={'#334477'} opacity={0.3} transparent />
          </mesh>
        ))}

        {/* Hour labels for top hours */}
        {spokes.filter(s => s.intensity > 0.6).map((s, i) => (
          <Html key={`label-${i}`} position={[s.x * 1.15, s.y * 1.15, 0]} center>
            <div className="font-google-sans-code text-xs pointer-events-none" style={{ color: colorValue }}>
              {s.hour.toString().padStart(2, '0')}:00
            </div>
          </Html>
        ))}
      </group>
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MODES: { key: Mode; label: string }[] = [
  { key: 'total', label: 'TOTAL' },
  { key: 'hourly', label: 'HOURLY' },
  { key: 'timeline', label: 'TIMELINE' },
  { key: 'peaks', label: 'PEAK DAYS' },
  { key: 'radar', label: 'RHYTHM' },
]

export default function AIWrappedVisualization({ height = '460px' }: { height?: string }) {
  const { colorValue } = useTheme()
  const [mode, setMode] = useState<Mode>('total')
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    fetch('/data/ai-analytics.json')
      .then(r => r.json())
      .then((d: Analytics) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ height, backgroundColor: 'var(--background)' }}
      >
        <div
          className="font-google-sans-code text-xs tracking-widest uppercase animate-pulse"
          style={{ color: colorValue }}
        >
          LOADING...
        </div>
      </div>
    )
  }

  return (
    <div
      className="vh-card-elevated rounded-xl overflow-hidden border animate-in fade-in slide-in-from-bottom-4 duration-200"
      style={{ backgroundColor: 'var(--background)', borderColor: `${colorValue}40` }}
    >
      {/* Header */}
      <div className="flex justify-between items-baseline px-5 pt-4 pb-2">
        <div>
          <div
            className="font-brandon-grotesque text-xs tracking-widest uppercase"
            style={{ color: colorValue }}
          >
            AI WRAPPED
          </div>
          <div className="font-google-sans-code text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {data.summary.dateRange.start.slice(0, 7)} — {data.summary.dateRange.end.slice(0, 7)}
          </div>
        </div>
        <div className="font-google-sans-code text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-vt323 text-sm">{data.summary.spanDays}</span> ACTIVE DAYS
        </div>
      </div>

      {/* Canvas */}
      <div style={{ height }}>
        <Canvas camera={{ position: [0, 3, 8], fov: 50 }} style={{ background: 'var(--background)' }}>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
          {mode === 'total' && <TotalScene data={data} />}
          {mode === 'hourly' && <HourlyScene data={data} />}
          {mode === 'timeline' && <TimelineScene data={data} />}
          {mode === 'peaks' && <PeaksScene data={data} />}
          {mode === 'radar' && <RadarScene data={data} />}
        </Canvas>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 flex-wrap px-4 pt-2 pb-4">
        {MODES.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={[
              'font-brandon-grotesque text-xs tracking-wider px-3 py-1 rounded-md border transition-colors duration-150 cursor-pointer',
              mode === m.key ? 'font-bold' : 'opacity-50 hover:opacity-80',
            ].join(' ')}
            style={{
              backgroundColor: mode === m.key ? colorValue : 'transparent',
              color: mode === m.key ? 'var(--background)' : 'var(--text-muted)',
              borderColor: mode === m.key ? colorValue : `${colorValue}30`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
