// Route Performance Analysis
import { readFileSync, statSync } from 'fs';
import { relative } from 'path';

interface RoutePerformanceMetrics {
  filePath: string;
  routePath: string;
  fileSize: number;
  linesOfCode: number;
  complexity: number;
  dependencies: string[];
  potentialOptimizations: string[];
}

export function analyzeRoutePerformance(routeFiles: string[]): RoutePerformanceMetrics[] {
  console.log('\x1b[33mAnalyzing route performance...\x1b[0m\n');
  
  const metrics: RoutePerformanceMetrics[] = [];

  routeFiles.forEach(filePath => {
    try {
      const stats = statSync(filePath);
      const content = readFileSync(filePath, 'utf-8');
      
      // Calculate basic metrics
      const fileSize = stats.size;
      const linesOfCode = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
      
      // Simple complexity analysis
      const complexityIndicators = [
        (content.match(/if\s*\(/g) || []).length,
        (content.match(/for\s*\(/g) || []).length,
        (content.match(/while\s*\(/g) || []).length,
        (content.match(/switch\s*\(/g) || []).length,
        (content.match(/catch\s*\(/g) || []).length,
      ];
      const complexity = complexityIndicators.reduce((sum, count) => sum + count, 0);

      // Detect dependencies
      const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
      const dependencies = importMatches.map(imp => {
        const match = imp.match(/from\s+['"]([^'"]+)['"]/);
        return match ? match[1] : '';
      }).filter(Boolean);

      // Suggest optimizations
      const potentialOptimizations: string[] = [];
      
      if (fileSize > 50000) {
        potentialOptimizations.push('Large file size - consider code splitting');
      }
      
      if (linesOfCode > 300) {
        potentialOptimizations.push('High line count - consider component extraction');
      }
      
      if (complexity > 15) {
        potentialOptimizations.push('High complexity - consider refactoring');
      }
      
      if (dependencies.length > 20) {
        potentialOptimizations.push('Many dependencies - audit for unused imports');
      }

      // Check for performance anti-patterns
      if (content.includes('useEffect(')) {
        const useEffectCount = (content.match(/useEffect\(/g) || []).length;
        if (useEffectCount > 5) {
          potentialOptimizations.push('Multiple useEffect hooks - consider optimization');
        }
      }

      if (content.includes('useState(')) {
        const useStateCount = (content.match(/useState\(/g) || []).length;
        if (useStateCount > 10) {
          potentialOptimizations.push('Many useState hooks - consider useReducer');
        }
      }

      // Check for inline styles or large objects
      if (content.includes('style={{') && (content.match(/style=\{\{/g) || []).length > 3) {
        potentialOptimizations.push('Inline styles detected - consider CSS modules or styled-components');
      }

      metrics.push({
        filePath,
        routePath: filePath, // This would be calculated properly in real usage
        fileSize,
        linesOfCode,
        complexity,
        dependencies,
        potentialOptimizations
      });

    } catch (error) {
      console.warn(`\x1b[33mWarning: Could not analyze: ${filePath}\x1b[0m`);
    }
  });

  // Sort by potential issues (size + complexity)
  metrics.sort((a, b) => {
    const scoreA = a.fileSize + (a.complexity * 1000) + (a.linesOfCode * 10);
    const scoreB = b.fileSize + (b.complexity * 1000) + (b.linesOfCode * 10);
    return scoreB - scoreA;
  });

  // Report findings
  console.log('\x1b[36mPerformance Analysis Results:\x1b[0m\n');
  
  const totalSize = metrics.reduce((sum, m) => sum + m.fileSize, 0);
  const avgComplexity = metrics.reduce((sum, m) => sum + m.complexity, 0) / metrics.length;
  
  console.log(`\x1b[32mSummary:\x1b[0m`);
  console.log(`   Total Routes: ${metrics.length}`);
  console.log(`   Total Size: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`   Average Complexity: ${avgComplexity.toFixed(1)}`);
  console.log(`   Routes with Issues: ${metrics.filter(m => m.potentialOptimizations.length > 0).length}\n`);

  // Show top issues
  const routesWithIssues = metrics.filter(m => m.potentialOptimizations.length > 0).slice(0, 5);
  if (routesWithIssues.length > 0) {
    console.log('\x1b[31mRoutes Needing Attention:\x1b[0m');
    routesWithIssues.forEach(route => {
      console.log(`   ${relative(process.cwd(), route.filePath)}`);
      console.log(`     Size: ${(route.fileSize / 1024).toFixed(1)} KB, Complexity: ${route.complexity}, Lines: ${route.linesOfCode}`);
      route.potentialOptimizations.forEach(opt => {
        console.log(`     • ${opt}`);
      });
      console.log();
    });
  }

  // Generate performance report
  const performanceReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRoutes: metrics.length,
      totalSize: totalSize,
      averageComplexity: avgComplexity,
      routesWithIssues: metrics.filter(m => m.potentialOptimizations.length > 0).length
    },
    routes: metrics.map(m => ({
      file: relative(process.cwd(), m.filePath),
      size: m.fileSize,
      linesOfCode: m.linesOfCode,
      complexity: m.complexity,
      dependencyCount: m.dependencies.length,
      optimizations: m.potentialOptimizations
    })),
    recommendations: [
      totalSize > 1024 * 1024 ? 'Consider implementing route-based code splitting' : null,
      avgComplexity > 10 ? 'Review complex routes for refactoring opportunities' : null,
      'Use React.lazy() for heavy route components',
      'Implement proper error boundaries for better UX'
    ].filter(Boolean)
  };

  const reportPath = './route-performance.json';
  require('fs').writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2), 'utf-8');
  console.log(`\x1b[32mPerformance report saved to: ${reportPath}\x1b[0m`);

  return metrics;
}
