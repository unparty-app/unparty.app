#!/usr/bin/env node

/**
 * Component Health Report Generator
 * Creates human-readable reports from component-health.json
 */

import fs from 'fs';
import { pathToFileURL } from 'url';

/**
 * Generate a comprehensive health report
 */
function generateHealthReport() {
  const healthDataPath = 'component-health.json';
  
  if (!fs.existsSync(healthDataPath)) {
    console.error('❌ component-health.json not found. Run: node scripts/generate-component-health.js');
    process.exit(1);
  }
  
  const healthData = JSON.parse(fs.readFileSync(healthDataPath, 'utf8'));
  
  console.log('📋 COMPONENT HEALTH REPORT');
  console.log('='.repeat(60));
  console.log(`Generated: ${new Date(healthData.metadata.generatedAt).toLocaleString()}`);
  console.log(`Repository: ${healthData.metadata.repository}`);
  console.log(`Total Components: ${healthData.metadata.totalComponents}`);
  
  // Summary Section
  console.log('\n📊 EXECUTIVE SUMMARY');
  console.log('-'.repeat(30));
  console.log(`Average Health Score: ${healthData.summary.averageHealthScore}%`);
  console.log(`Components Needing Attention: ${healthData.summary.componentCounts.needsAttention}`);
  console.log(`Excellent Components: ${healthData.summary.componentCounts.excellent}`);
  
  // Compliance Rates
  console.log('\n🎯 COMPLIANCE RATES');
  console.log('-'.repeat(30));
  console.log(`Design System: ${healthData.summary.compliance.designSystem}%`);
  console.log(`Accessibility: ${healthData.summary.compliance.accessibility}%`);
  console.log(`Performance: ${healthData.summary.compliance.performance}%`);
  console.log(`TypeScript: ${healthData.summary.compliance.typeScript}%`);
  
  // Health Distribution
  console.log('\n🏥 HEALTH DISTRIBUTION');
  console.log('-'.repeat(30));
  Object.entries(healthData.summary.healthDistribution).forEach(([status, count]) => {
    const emoji = {
      excellent: '🟢',
      good: '🟡',
      fair: '🟠',
      poor: '🔴',
      critical: '🚨'
    }[status] || '⚪';
    const percentage = Math.round((count / healthData.metadata.totalComponents) * 100);
    console.log(`${emoji} ${status.toUpperCase()}: ${count} components (${percentage}%)`);
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(30));
  healthData.summary.recommendations.forEach((rec, index) => {
    const emoji = {
      high: '🚨',
      medium: '⚠️',
      low: 'ℹ️',
      info: '✨'
    }[rec.priority] || '📝';
    
    console.log(`\n${index + 1}. ${emoji} ${rec.category} (${rec.priority.toUpperCase()} PRIORITY)`);
    console.log(`   ${rec.description}`);
    console.log(`   Action: ${rec.action}`);
    if (rec.components.length > 0) {
      console.log(`   Components: ${rec.components.join(', ')}`);
    }
  });
  
  // Top Issues Section
  console.log('\n🔴 COMPONENTS REQUIRING IMMEDIATE ATTENTION');
  console.log('-'.repeat(50));
  
  const criticalComponents = healthData.health
    .filter(h => h.metrics.overallScore < 40)
    .sort((a, b) => a.metrics.overallScore - b.metrics.overallScore)
    .slice(0, 10);
  
  criticalComponents.forEach(comp => {
    const componentData = healthData.components.find(c => c.id === comp.component);
    console.log(`\n📄 ${componentData.name} (Score: ${comp.metrics.overallScore}%)`);
    console.log(`   Path: ${componentData.path}`);
    console.log(`   Issues:`);
    
    if (comp.metrics.designSystemCompliance.score < 50) {
      console.log(`   • Design System: ${comp.metrics.designSystemCompliance.score}% - Needs CSS variables and brand colors`);
    }
    if (comp.metrics.accessibility.score < 50) {
      console.log(`   • Accessibility: ${comp.metrics.accessibility.score}% - Missing semantic HTML and ARIA attributes`);
    }
    if (comp.metrics.performance.score < 50) {
      console.log(`   • Performance: ${comp.metrics.performance.score}% - Consider Next.js Image and lazy loading`);
    }
    if (comp.metrics.responsiveDesign.score < 50) {
      console.log(`   • Responsive: ${comp.metrics.responsiveDesign.score}% - Add responsive classes and breakpoints`);
    }
  });
  
  // Success Stories
  console.log('\n🟢 SUCCESS STORIES - COMPONENTS TO EMULATE');
  console.log('-'.repeat(50));
  
  const excellentComponents = healthData.health
    .filter(h => h.metrics.overallScore >= 80)
    .sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);
  
  excellentComponents.forEach(comp => {
    const componentData = healthData.components.find(c => c.id === comp.component);
    console.log(`\n✨ ${componentData.name} (Score: ${comp.metrics.overallScore}%)`);
    console.log(`   Path: ${componentData.path}`);
    console.log(`   Strengths:`);
    
    if (comp.metrics.designSystemCompliance.score >= 80) {
      console.log(`   • Design System: ${comp.metrics.designSystemCompliance.score}% - Excellent use of design tokens`);
    }
    if (comp.metrics.performance.score >= 80) {
      console.log(`   • Performance: ${comp.metrics.performance.score}% - Well optimized`);
    }
    if (comp.metrics.responsiveDesign.score >= 80) {
      console.log(`   • Responsive: ${comp.metrics.responsiveDesign.score}% - Mobile-first design`);
    }
  });
  
  // Action Plan
  console.log('\n📋 SUGGESTED ACTION PLAN');
  console.log('-'.repeat(30));
  console.log('1. 🚨 IMMEDIATE (This Sprint):');
  console.log('   • Fix critical components with scores < 20%');
  console.log('   • Focus on design system compliance for core layout components');
  
  console.log('\n2. ⚠️ SHORT-TERM (Next Sprint):');
  console.log('   • Update components with poor scores (20-40%) to use CSS variables');
  console.log('   • Add accessibility attributes to high-traffic components');
  
  console.log('\n3. 📈 MEDIUM-TERM (Next 2-3 Sprints):');
  console.log('   • Improve performance optimization across all components');
  console.log('   • Standardize responsive design patterns');
  
  console.log('\n4. ✨ LONG-TERM (Ongoing):');
  console.log('   • Maintain 80%+ average health score');
  console.log('   • Use excellent components as templates for new development');
  
  console.log('\n📝 NEXT STEPS');
  console.log('-'.repeat(20));
  console.log('• Run this analysis regularly (weekly/bi-weekly)');
  console.log('• Set health score targets for new components (minimum 70%)');
  console.log('• Create component templates based on excellent components');
  console.log('• Integrate health checks into CI/CD pipeline');
  
  console.log(`\n📄 Full details available in: ${healthDataPath}`);
}

/**
 * Generate focused report for specific components
 */
function generateFocusedReport(componentNames) {
  const healthDataPath = 'component-health.json';
  
  if (!fs.existsSync(healthDataPath)) {
    console.error('❌ component-health.json not found. Run: node scripts/generate-component-health.js');
    process.exit(1);
  }
  
  const healthData = JSON.parse(fs.readFileSync(healthDataPath, 'utf8'));
  
  console.log('🔍 FOCUSED COMPONENT REPORT');
  console.log('='.repeat(40));
  
  componentNames.forEach(componentName => {
    const health = healthData.health.find(h => h.component === componentName.toLowerCase());
    const component = healthData.components.find(c => c.id === componentName.toLowerCase());
    
    if (!health || !component) {
      console.log(`❌ Component "${componentName}" not found`);
      return;
    }
    
    console.log(`\n📄 ${component.name}`);
    console.log('-'.repeat(30));
    console.log(`Path: ${component.path}`);
    console.log(`Overall Score: ${health.metrics.overallScore}% (${health.metrics.healthStatus})`);
    console.log(`Lines of Code: ${health.metrics.linesOfCode}`);
    console.log(`TypeScript: ${health.metrics.hasTypeScript ? '✅' : '❌'}`);
    
    console.log('\nDetailed Scores:');
    console.log(`• Design System: ${health.metrics.designSystemCompliance.score}%`);
    console.log(`• Accessibility: ${health.metrics.accessibility.score}%`);
    console.log(`• Performance: ${health.metrics.performance.score}%`);
    console.log(`• Code Quality: ${health.metrics.codeQuality.score}%`);
    console.log(`• Responsive Design: ${health.metrics.responsiveDesign.score}%`);
    
    // Git history
    if (component.firstCommit) {
      console.log('\nGit History:');
      console.log(`• First Commit: ${component.firstCommitDate ? new Date(component.firstCommitDate).toLocaleDateString() : 'Unknown'}`);
      console.log(`• Last Commit: ${component.lastCommitDate ? new Date(component.lastCommitDate).toLocaleDateString() : 'Unknown'}`);
      console.log(`• Total Commits: ${component.commitCount}`);
    }
  });
}

/**
 * CLI execution
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    generateHealthReport();
  } else if (args[0] === '--component' || args[0] === '-c') {
    const componentNames = args.slice(1);
    if (componentNames.length === 0) {
      console.error('Usage: node report-component-health.js --component <component-name> [component-name2] ...');
      process.exit(1);
    }
    generateFocusedReport(componentNames);
  } else {
    console.error('Usage: node report-component-health.js [--component <component-name>]');
    process.exit(1);
  }
}

export { generateHealthReport, generateFocusedReport };