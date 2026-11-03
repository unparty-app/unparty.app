/**
 * Example usage of repo-metadata-averages utility
 * Demonstrates how to use the utility functions
 */

import { 
  getTimeBoundedCommitsBaseline,
  getRepositoryAveragesBaseline,
  loadRawRepositoryMetadata,
  calculateTimeBoundedCommitsAverages
} from './repo-metadata-averages'

/**
 * Example: Get baseline averages for time-bounded commits
 */
export async function exampleTimeBoundedCommitsBaseline() {
  try {
    const baseline = await getTimeBoundedCommitsBaseline()
    
    console.log('TIME-BOUNDED COMMITS BASELINE AVERAGES:')
    console.log(`COMMITS_LAST_5_DAYS: ${baseline.averages.commits_last_5_days}`)
    console.log(`COMMITS_LAST_7_DAYS: ${baseline.averages.commits_last_7_days}`) 
    console.log(`COMMITS_LAST_30_DAYS: ${baseline.averages.commits_last_30_days}`)
    console.log(`WEIGHTED_ACTIVITY_SCORE: ${baseline.averages.weighted_activity_score}`)
    console.log(`UNIQUE_AUTHORS_5D: ${baseline.averages.unique_authors_5d}`)
    console.log(`UNIQUE_AUTHORS_7D: ${baseline.averages.unique_authors_7d}`)
    console.log(`UNIQUE_AUTHORS_30D: ${baseline.averages.unique_authors_30d}`)
    
    return baseline
  } catch (error) {
    console.error('Failed to get time-bounded commits baseline:', error)
    throw error
  }
}

/**
 * Example: Get comprehensive repository averages
 */
export async function exampleRepositoryAveragesBaseline() {
  try {
    const averages = await getRepositoryAveragesBaseline()
    
    console.log('COMPREHENSIVE REPOSITORY AVERAGES:')
    console.log(`Repository Count: ${averages.repositoryCount}`)
    console.log(`Average Stars: ${averages.basic.stars}`)
    console.log(`Average Activity Score: ${averages.basic.activity_score}`)
    console.log(`Average Community Health: ${averages.enhanced.community_health_score}`)
    
    return averages
  } catch (error) {
    console.error('Failed to get repository averages baseline:', error)
    throw error
  }
}

/**
 * Example: Load and analyze raw metadata manually
 */
export async function exampleManualAnalysis() {
  try {
    const repositories = await loadRawRepositoryMetadata()
    const timeBoundedSummary = calculateTimeBoundedCommitsAverages(repositories)
    
    console.log(`Total repositories: ${repositories.length}`)
    console.log(`Repositories with time-bounded data: ${timeBoundedSummary.repositoriesWithData.length}`)
    console.log(`Data availability: ${((timeBoundedSummary.repositoriesWithData.length / repositories.length) * 100).toFixed(1)}%`)
    
    return timeBoundedSummary
  } catch (error) {
    console.error('Failed to perform manual analysis:', error)
    throw error
  }
}