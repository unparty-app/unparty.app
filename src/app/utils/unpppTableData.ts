// Data merger utility for UnpppTable component
// Combines data from UnpppsConfig, unppp-scores, and unppp-repo-time

import UnpppsConfig from '../../data/UnpppsConfig.json';
import unpppScores from '../../../public/data/unppp-scores.json';
import unpppRepoTime from '../../../unppp-repo-time.json';
import unpppCostEstimate from '../../../unparty-polar-unppp-cost-estimate.json';

export interface EnrichedUnppp {
  // From UnpppsConfig.json
  id: string;
  name: string;
  priority: number;
  category: string | null;
  color: string;
  polarPrice: number;
  featured: boolean;
  tagline: string;
  description: string;
  url?: string;
  cover?: string;
  
  // From unppp-scores.json (optional - not all UNPPPs have repos)
  type?: 'app' | 'agent' | 'service' | 'bot' | 'assistant' | 'library' | 'framework' | 'tool';
  velocity_trend?: 'increasing' | 'decreasing' | 'stable';
  standards_score?: number;
  confidence?: number;
  monthly_standards_score?: number;
  commits_per_month?: number;
  
  // From unppp-repo-time.json (optional)
  total_hours?: number;
  hours_formatted?: string;
  commit_count?: number;
  utilization_rate?: number;
  session_count?: number;
}

export type UnpppFilterType = 'all' | 'app' | 'agent' | 'service' | 'bot' | 'assistant' | 'library' | 'framework' | 'tool';
export type VelocityFilterType = 'all' | 'increasing' | 'decreasing' | 'stable';
export type SortColumn = 'name' | 'type' | 'price' | 'hours' | 'velocity' | 'standards' | 'priority';
export type SortDirection = 'asc' | 'desc';

/**
 * Merge data from three sources by matching id field
 * @returns Array of enriched UNPPP objects
 */
export function getMergedUnpppData(): EnrichedUnppp[] {
  const unppps = UnpppsConfig.unppps;
  
  // Create lookup maps for faster access
  const scoresMap = new Map(
    unpppScores.scores.map(score => [score.id, score])
  );
  
  const repoTimeMap = new Map(
    unpppRepoTime.repositories.map(repo => [repo.repo_id, repo])
  );

  const costMap = new Map(
    unpppCostEstimate.unppps.map(cost => [cost.id, cost])
  );

  // Merge data for each unppp
  return unppps.map(unppp => {
    const scoreData = scoresMap.get(unppp.id);
    const timeData = repoTimeMap.get(unppp.id);
    const costData = costMap.get(unppp.id);

    const enriched: EnrichedUnppp = {
      id: unppp.id,
      name: unppp.name,
      priority: unppp.priority,
      category: unppp.category,
      color: unppp.color || '#F9C22E',
      polarPrice: costData?.price_breakdown.polar_price ?? 0,
      featured: unppp.featured || false,
      tagline: unppp.tagline || '',
      description: unppp.description || '',
      url: unppp.url,
      cover: unppp.cover,
    };
    
    // Add score data if available
    if (scoreData) {
      enriched.type = scoreData.type as EnrichedUnppp['type'];
      enriched.velocity_trend = scoreData.velocity_trend as EnrichedUnppp['velocity_trend'];
      enriched.standards_score = scoreData.standards_score;
      enriched.confidence = scoreData.confidence;
      enriched.monthly_standards_score = scoreData.monthly_standards_score;
      enriched.commits_per_month = scoreData.commits_per_month;
    }
    
    // Add repo time data if available
    if (timeData) {
      enriched.total_hours = timeData.total_hours;
      enriched.hours_formatted = timeData.hours_formatted;
      enriched.commit_count = timeData.commit_count;
      enriched.utilization_rate = timeData.utilization_rate;
      enriched.session_count = timeData.session_count;
    }
    
    return enriched;
  });
}

/**
 * Filter UNPPPs by type, velocity, debt range, and hours range
 */
export function filterUnppps(
  unppps: EnrichedUnppp[],
  typeFilter: UnpppFilterType,
  velocityFilter: VelocityFilterType,
  priceRange: [number, number],
  hoursRange: [number, number]
): EnrichedUnppp[] {
  return unppps.filter(unppp => {
    // Type filter
    if (typeFilter !== 'all' && unppp.type !== typeFilter) {
      return false;
    }

    // Velocity filter
    if (velocityFilter !== 'all' && unppp.velocity_trend !== velocityFilter) {
      return false;
    }

    // Price range filter
    if (unppp.polarPrice < priceRange[0] || unppp.polarPrice > priceRange[1]) {
      return false;
    }
    
    // Hours range filter
    const hours = unppp.total_hours || 0;
    if (hours < hoursRange[0] || hours > hoursRange[1]) {
      return false;
    }
    
    return true;
  });
}

/**
 * Sort UNPPPs by column and direction
 */
export function sortUnppps(
  unppps: EnrichedUnppp[],
  column: SortColumn,
  direction: SortDirection
): EnrichedUnppp[] {
  const sorted = [...unppps];
  
  sorted.sort((a, b) => {
    let aVal: string | number | undefined;
    let bVal: string | number | undefined;
    
    switch (column) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'type':
        aVal = a.type || 'zzz'; // Push undefined to end
        bVal = b.type || 'zzz';
        break;
      case 'price':
        aVal = a.polarPrice;
        bVal = b.polarPrice;
        break;
      case 'hours':
        aVal = a.total_hours || 0;
        bVal = b.total_hours || 0;
        break;
      case 'velocity':
        // Custom sort for velocity trend
        const velocityOrder = { increasing: 3, stable: 2, decreasing: 1 };
        aVal = velocityOrder[a.velocity_trend as keyof typeof velocityOrder] || 0;
        bVal = velocityOrder[b.velocity_trend as keyof typeof velocityOrder] || 0;
        break;
      case 'standards':
        aVal = a.standards_score || 0;
        bVal = b.standards_score || 0;
        break;
      case 'priority':
        aVal = a.priority;
        bVal = b.priority;
        break;
      default:
        aVal = a.priority;
        bVal = b.priority;
    }
    
    // Handle string vs number comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    const aNum = typeof aVal === 'number' ? aVal : 0;
    const bNum = typeof bVal === 'number' ? bVal : 0;
    
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  });
  
  return sorted;
}

/**
 * Get unique types from UNPPPs for filter dropdown
 */
export function getAvailableTypes(unppps: EnrichedUnppp[]): UnpppFilterType[] {
  const types = new Set<UnpppFilterType>();
  types.add('all');
  
  unppps.forEach(unppp => {
    if (unppp.type) {
      types.add(unppp.type);
    }
  });
  
  return Array.from(types);
}

/**
 * Get polar price range from UNPPPs
 */
export function getPriceRange(unppps: EnrichedUnppp[]): [number, number] {
  if (unppps.length === 0) return [0, 20000];

  const prices = unppps.map(u => u.polarPrice);
  return [Math.min(...prices), Math.max(...prices)];
}

/**
 * Get hours range from UNPPPs
 */
export function getHoursRange(unppps: EnrichedUnppp[]): [number, number] {
  if (unppps.length === 0) return [0, 400];
  
  const hours = unppps.map(u => u.total_hours || 0).filter(h => h > 0);
  if (hours.length === 0) return [0, 400];
  
  return [Math.min(...hours), Math.max(...hours)];
}
