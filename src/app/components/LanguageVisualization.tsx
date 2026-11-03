'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { RepositoryMetadata, LanguageData, AggregatedLanguageStats } from '@/types/repository-metadata'
import { getRepoMetadata } from '@/utils/repoMetadataClient'
import {
  getAggregatedStats,
  formatBytes
} from '@/utils/language-calculations'

/**
 * LanguageVisualization Component
 * 
 * Interactive D3.js visualization for repository language distribution.
 * Uses static data from raw-repo-metadata.json for optimal performance.
 * 
 * Architecture Decision:
 * - Static data approach provides <100ms load time vs 500-1000ms with API
 * - No authentication required, no rate limiting
 * - Enhanced metrics not available through GitHub API
 * 
 * @see https://github.com/unparty-app/theunpartyapp/issues/310
 */

interface LanguageVisualizationProps {
  width?: number;
  height?: number;
  /** Pre-loaded repository data (optional). If not provided, loads from raw-repo-metadata.json */
  repositories?: RepositoryMetadata[];
}

function drawPieChart(svgEl: SVGSVGElement, languages: LanguageData[], width: number, height: number) {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const margin = 40
  const radius = Math.min(width, height) / 2 - margin

  const g = svg
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const pie = d3.pie<LanguageData>()
    .value(d => d.percentage)
    .sort(null)

  const arc = d3.arc<d3.PieArcDatum<LanguageData>>()
    .innerRadius(0)
    .outerRadius(radius)

  const arcLabel = d3.arc<d3.PieArcDatum<LanguageData>>()
    .innerRadius(radius * 0.6)
    .outerRadius(radius * 0.6)

  const arcs = g.selectAll('.arc')
    .data(pie(languages))
    .enter()
    .append('g')
    .attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('transform', 'scale(1.05)')
      
      // Tooltip
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)

      tooltip.transition()
        .duration(200)
        .style('opacity', 1)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .text(`${d.data.name}: ${d.data.percentage}%`)
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('transform', 'scale(1)')
      
      d3.selectAll('.tooltip').remove()
    })

  arcs.append('text')
    .attr('transform', d => `translate(${arcLabel.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .attr('fill', 'white')
    .text(d => d.data.percentage > 5 ? `${d.data.percentage}%` : '')
}

function drawBarChart(svgEl: SVGSVGElement, languages: LanguageData[], width: number, height: number) {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const margin = { top: 20, right: 30, bottom: 40, left: 120 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const x = d3.scaleLinear()
    .domain([0, d3.max(languages, d => d.percentage) || 0])
    .range([0, chartWidth])

  const y = d3.scaleBand()
    .domain(languages.map(d => d.name))
    .range([0, chartHeight])
    .padding(0.1)

  // Add bars
  g.selectAll('.bar')
    .data(languages)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => y(d.name) || 0)
    .attr('width', d => x(d.percentage))
    .attr('height', y.bandwidth())
    .attr('fill', d => d.color)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.8)
      
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)

      tooltip.transition()
        .duration(200)
        .style('opacity', 1)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .text(`${d.name}: ${d.percentage}%`)
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
      
      d3.selectAll('.tooltip').remove()
    })

  // Add percentage labels
  g.selectAll('.label')
    .data(languages)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.percentage) + 5)
    .attr('y', d => (y(d.name) || 0) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('font-size', '12px')
    .attr('fill', 'white')
    .text(d => `${d.percentage}%`)

  // Add y-axis (language names)
  g.append('g')
    .selectAll('.y-label')
    .data(languages)
    .enter()
    .append('text')
    .attr('class', 'y-label')
    .attr('x', -10)
    .attr('y', d => (y(d.name) || 0) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('font-size', '12px')
    .attr('fill', 'currentColor')
    .text(d => d.name)

  // Add x-axis
  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x).tickFormat(d => `${d}%`))
}

export default function LanguageVisualization({ 
  width = 600, 
  height = 400,
  repositories 
}: LanguageVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [fetchedRepos, setFetchedRepos] = useState<RepositoryMetadata[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewType, setViewType] = useState<'pie' | 'bar'>('pie')
  const [showMarkup, setShowMarkup] = useState(true)

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
    () => (repoData && repoData.length > 0 ? getAggregatedStats(repoData, showMarkup) : null),
    [repoData, showMarkup]
  )

  // Redraw the d3 chart when the data, view, or size changes
  useEffect(() => {
    if (!stats?.languages || !svgRef.current) return

    if (viewType === 'pie') {
      drawPieChart(svgRef.current, stats.languages, width, height)
    } else {
      drawBarChart(svgRef.current, stats.languages, width, height)
    }
  }, [stats, viewType, width, height])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="space-y-2 text-center">
          <div className="size-12 mx-auto animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
          <div className="font-google-sans-code text-gray-600 dark:text-gray-400">Loading repository data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
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
      <div className="flex items-center justify-center p-8">
        <div className="font-google-sans-code text-gray-600 dark:text-gray-400">No language data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-google-sans-code text-sm text-gray-600 dark:text-gray-400">
            {stats.languageCount} languages • {stats.totalRepositories} repositories • {formatBytes(stats.totalBytes)} of code
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('pie')}
            className={`rounded px-3 py-1 font-google-sans-code text-sm transition ${
              viewType === 'pie'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pie Chart
          </button>
          <button
            onClick={() => setViewType('bar')}
            className={`rounded px-3 py-1 font-google-sans-code text-sm transition ${
              viewType === 'bar'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setShowMarkup(!showMarkup)}
            className={`rounded px-3 py-1 font-google-sans-code text-sm transition ${
              !showMarkup
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            title="Toggle markup/config languages (HTML, CSS, JSON, etc.)"
          >
            {showMarkup ? 'All Languages' : 'Programming Only'}
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div className="rounded-xl border border-gray-200 bg-gray-100 p-6 dark:border-gray-700 dark:bg-black/20">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {stats.languages.map((lang, index) => (
          <div key={index} className="flex items-center gap-2 font-google-sans-code text-sm">
            <div
              className="size-4 rounded flex-shrink-0"
              style={{ backgroundColor: lang.color }}
            />
            <span className="text-gray-900 dark:text-white">{lang.name}</span>
            <span className="text-gray-600 dark:text-gray-400">({lang.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}