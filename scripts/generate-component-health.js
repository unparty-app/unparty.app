#!/usr/bin/env node

/**
 * Component Health Generator
 * Generates comprehensive component-health.json file combining history and health analysis
 */

import fs from 'fs';
import path from 'path';
import { analyzeComponents } from './analyze-component-history.js';
import { analyzeComponentFile, getHealthStatus } from './analyze-component-health.js';
import { pathToFileURL } from 'url';

// "<owner>/<repo>" from the site owner's GitHub account (FoundersConfig.json)
// and this package's name
function repositoryName() {
  try {
    const founders = JSON.parse(fs.readFileSync('src/data/FoundersConfig.json', 'utf8'));
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return `${founders.site.github}/${pkg.name}`;
  } catch {
    return null;
  }
}

/**
 * Generate comprehensive component health report
 */
async function generateComponentHealth() {
  console.log('🔍 Starting comprehensive component health analysis...');
  
  try {
    // Step 1: Analyze component history
    console.log('\n📚 Analyzing component history...');
    const components = await analyzeComponents();
    
    // Step 2: Analyze component health for each file
    console.log('\n🏥 Analyzing component health...');
    const health = [];
    
    for (const component of components) {
      
      
      const filePath = path.join(process.cwd(), component.path);
      const healthAnalysis = analyzeComponentFile(filePath);
      
      health.push({
        component: component.id,
        metrics: {
          designSystemCompliance: healthAnalysis.designSystemCompliance,
          accessibility: healthAnalysis.accessibility,
          performance: healthAnalysis.performance,
          codeQuality: healthAnalysis.codeQuality,
          responsiveDesign: healthAnalysis.responsiveDesign,
          overallScore: healthAnalysis.overallScore,
          healthStatus: getHealthStatus(healthAnalysis.overallScore),
          linesOfCode: healthAnalysis.linesOfCode,
          hasTypeScript: healthAnalysis.hasTypeScript,
          hasMDX: healthAnalysis.hasMDX
        }
      });
    }
    
    // Step 3: Generate summary statistics
    console.log('\n📊 Generating summary statistics...');
    const summary = generateSummary(components, health);
    
    // Step 4: Create final structure
    const componentHealthData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalComponents: components.length,
        analysisVersion: '1.0.0',
        repository: repositoryName()
      },
      summary,
      components,
      health
    };
    
    // Step 5: Write to file
    const outputPath = 'component-health.json';
    fs.writeFileSync(outputPath, JSON.stringify(componentHealthData, null, 2));
    
    console.log('\n✅ Component health analysis complete!');
    console.log(`📄 Report saved to: ${outputPath}`);
    
    // Display summary
    displaySummary(summary);
    
    return componentHealthData;
    
  } catch (error) {
    console.error('❌ Error generating component health report:', error);
    process.exit(1);
  }
}

/**
 * Generate summary statistics
 */
function generateSummary(components, health) {
  const healthByScore = health.reduce((acc, h) => {
    const status = h.metrics.healthStatus;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const averageScore = Math.round(
    health.reduce((sum, h) => sum + h.metrics.overallScore, 0) / health.length
  );
  
  const designSystemCompliance = health.filter(h => 
    h.metrics.designSystemCompliance.score >= 60
  ).length;
  
  const accessibilityCompliance = health.filter(h => 
    h.metrics.accessibility.score >= 60
  ).length;
  
  const performanceCompliance = health.filter(h => 
    h.metrics.performance.score >= 60
  ).length;
  
  const typeScriptUsage = health.filter(h => 
    h.metrics.hasTypeScript
  ).length;
  
  // Find components that need attention
  const criticalComponents = health
    .filter(h => h.metrics.overallScore < 40)
    .map(h => h.component)
    .sort();
  
  const excellentComponents = health
    .filter(h => h.metrics.overallScore >= 80)
    .map(h => h.component)
    .sort();
  
  // Analyze commit activity
  const componentsWithHistory = components.filter(c => c.firstCommit);
  const recentlyUpdated = components
    .filter(c => c.lastCommitDate && 
      new Date(c.lastCommitDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    .length;
  
  return {
    averageHealthScore: averageScore,
    healthDistribution: healthByScore,
    compliance: {
      designSystem: Math.round((designSystemCompliance / health.length) * 100),
      accessibility: Math.round((accessibilityCompliance / health.length) * 100),
      performance: Math.round((performanceCompliance / health.length) * 100),
      typeScript: Math.round((typeScriptUsage / health.length) * 100)
    },
    componentCounts: {
      total: components.length,
      withGitHistory: componentsWithHistory.length,
      recentlyUpdated: recentlyUpdated,
      needsAttention: criticalComponents.length,
      excellent: excellentComponents.length
    },
    recommendations: generateRecommendations(criticalComponents, excellentComponents, health)
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(criticalComponents, excellentComponents, health) {
  const recommendations = [];
  
  // Components needing immediate attention
  if (criticalComponents.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Critical Components',
      description: `${criticalComponents.length} components have critical health scores (<40%) and need immediate attention`,
      components: criticalComponents.slice(0, 5), // Show top 5
      action: 'Update to use design system patterns from globals.css'
    });
  }
  
  // Design system compliance
  const lowDesignSystemComponents = health
    .filter(h => h.metrics.designSystemCompliance.score < 50)
    .map(h => h.component);
  
  if (lowDesignSystemComponents.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Design System Compliance',
      description: `${lowDesignSystemComponents.length} components don't follow design system patterns`,
      components: lowDesignSystemComponents.slice(0, 5),
      action: 'Add CSS variables, visual hierarchy classes, and brand colors'
    });
  }
  
  // Accessibility improvements
  const lowAccessibilityComponents = health
    .filter(h => h.metrics.accessibility.score < 50)
    .map(h => h.component);
  
  if (lowAccessibilityComponents.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Accessibility',
      description: `${lowAccessibilityComponents.length} components need accessibility improvements`,
      components: lowAccessibilityComponents.slice(0, 5),
      action: 'Add semantic HTML, ARIA attributes, and focus management'
    });
  }
  
  // Performance optimizations
  const lowPerformanceComponents = health
    .filter(h => h.metrics.performance.score < 50)
    .map(h => h.component);
  
  if (lowPerformanceComponents.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'Performance',
      description: `${lowPerformanceComponents.length} components could benefit from performance optimizations`,
      components: lowPerformanceComponents.slice(0, 5),
      action: 'Use Next.js Image component and lazy loading'
    });
  }
  
  // Success stories
  if (excellentComponents.length > 0) {
    recommendations.push({
      priority: 'info',
      category: 'Examples to Follow',
      description: `${excellentComponents.length} components demonstrate excellent practices`,
      components: excellentComponents.slice(0, 5),
      action: 'Use these as templates for updating other components'
    });
  }
  
  return recommendations;
}

/**
 * Display summary in console
 */
function displaySummary(summary) {
  console.log('\n📈 COMPONENT HEALTH SUMMARY');
  console.log('─'.repeat(50));
  console.log(`Average Health Score: ${summary.averageHealthScore}%`);
  console.log(`Total Components: ${summary.componentCounts.total}`);
  console.log(`Components with Git History: ${summary.componentCounts.withGitHistory}`);
  console.log(`Recently Updated: ${summary.componentCounts.recentlyUpdated}`);
  
  console.log('\n🏥 Health Distribution:');
  Object.entries(summary.healthDistribution).forEach(([status, count]) => {
    const emoji = {
      excellent: '🟢',
      good: '🟡',
      fair: '🟠',
      poor: '🔴',
      critical: '🚨'
    }[status] || '⚪';
    console.log(`  ${emoji} ${status}: ${count} components`);
  });
  
  console.log('\n📊 Compliance Rates:');
  console.log(`  Design System: ${summary.compliance.designSystem}%`);
  console.log(`  Accessibility: ${summary.compliance.accessibility}%`);
  console.log(`  Performance: ${summary.compliance.performance}%`);
  console.log(`  TypeScript: ${summary.compliance.typeScript}%`);
  
  if (summary.recommendations.length > 0) {
    console.log('\n💡 Key Recommendations:');
    summary.recommendations.slice(0, 3).forEach(rec => {
      const emoji = {
        high: '🚨',
        medium: '⚠️',
        low: 'ℹ️',
        info: '✨'
      }[rec.priority] || '📝';
      console.log(`  ${emoji} ${rec.category}: ${rec.description}`);
    });
  }
}

/**
 * CLI execution
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateComponentHealth();
}

export { generateComponentHealth };