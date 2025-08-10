import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { generateRoutesFile } from './generator';

export interface Config {
  input: string;
  output: string;
  framework: 'nextjs' | 'nextjs-app' | 'remix' | 'astro' | 'sveltekit';
  excludePatterns: string[];
  includeQueryParams: boolean;
  generateTests: boolean;
  generateApiRoutes?: boolean;
  routeAnalytics?: boolean;
}

interface DiscoveredRouteEntry {
  filePath: string;
  routePath: string;
  params: { name: string; type: string; optional?: boolean; catchAll?: boolean; }[];
  queryParams?: { name: string; type: string; optional?: boolean; }[];
}

function getRoutePathFromFilePath(filePath: string, basePagesDir: string, framework: string): string {
  let routePath = relative(basePagesDir, filePath);
  routePath = routePath.replace(/\.(tsx|ts|jsx|js)$/, '');

  // Handle different framework patterns
  switch (framework) {
    case 'nextjs':
      routePath = routePath.replace(/\[\[\.\.\.([^[\]]+)\]\]/g, ':$1*');
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      break;
    case 'nextjs-app':
      // Next.js App Router specific patterns
      routePath = routePath.replace(/\(([^)]+)\)/g, ''); // Remove route groups
      routePath = routePath.replace(/\[\[\.\.\.([^[\]]+)\]\]/g, ':$1*');
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      // Handle page.tsx, layout.tsx, loading.tsx, error.tsx, etc.
      routePath = routePath.replace(/\/(page|layout|loading|error|not-found|template)$/, '');
      break;
    case 'remix':
      routePath = routePath.replace(/\$([^.]+)/g, ':$1');
      break;
    case 'sveltekit':
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      routePath = routePath.replace(/\[\.\.\.([^\]]+)\]/g, ':$1*');
      break;
    case 'astro':
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      routePath = routePath.replace(/\[\.\.\.([^\]]+)\]/g, ':$1*');
      break;
  }

  if (routePath === 'index') {
    routePath = '/';
  } else if (routePath.endsWith('/index')) {
    routePath = routePath.slice(0, -6);
  }

  if (!routePath.startsWith('/') && routePath !== '') {
    routePath = `/${routePath}`;
  }

  if (routePath === '') {
      routePath = '/';
  }

  return routePath;
}

export function getAllFilePaths(dirPath: string, excludePatterns: string[] = [], fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dirPath, { withFileTypes: true });

    files.forEach(file => {
      const fullPath = join(dirPath, file.name);
      const relativePath = relative(process.cwd(), fullPath);

      // Check exclude patterns
      const shouldExclude = excludePatterns.some(pattern => {
        // Simple glob pattern matching
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(relativePath);
      });

      if (shouldExclude) {
        return;
      }

      if (file.isDirectory()) {
        getAllFilePaths(fullPath, excludePatterns, fileList);
      } else if (file.isFile() && /\.(tsx|ts|jsx|js)$/.test(file.name)) {
        // For App Router, only include page.tsx, layout.tsx files for route generation
        const isAppRouterFile = file.name.match(/^(page|layout)\.(tsx|ts|jsx|js)$/);
        const isRegularFile = !file.name.match(/^(layout|loading|error|not-found|template|global-error)\.(tsx|ts|jsx|js)$/);
        
        if (isAppRouterFile || isRegularFile) {
          fileList.push(fullPath);
        }
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return fileList;
}

function extractQueryParams(filePath: string): { name: string; type: string; optional?: boolean; }[] {
  const content = readFileSync(filePath, 'utf-8');
  const params: { name: string; type: string; optional?: boolean; }[] = [];

  const interfaceMatch = content.match(/export interface QueryParams\s*{(.*?)}/s);

  if (interfaceMatch && interfaceMatch[1]) {
    const properties = interfaceMatch[1].split(';').map(p => p.trim()).filter(p => p.length > 0);
    properties.forEach(prop => {
      const match = prop.match(/^(\w+)\s*(\?)?:\s*([\w\[\]]+)/);
      if (match) {
        const name = match[1];
        const optional = !!match[2];
        const type = match[3];
        params.push({ name, type, optional });
      }
    });
  }
  return params;
}

export function generateRoutes(config: Config): void {
  const inputPath = resolve(config.input);
  const outputPath = resolve(config.output);

  console.log(`\nScanning routes in: ${inputPath}`);
  console.log(`Framework: ${config.framework}`);

  if (!require('fs').existsSync(inputPath)) {
    console.error(`\x1b[31mError: Input directory does not exist: ${inputPath}\x1b[0m`);
    return;
  }

  const allRouteFiles = getAllFilePaths(inputPath, config.excludePatterns);
  const discoveredRoutes: DiscoveredRouteEntry[] = [];

  console.log("\nDiscovered Route Files:");
  allRouteFiles.forEach(filePath => {
    const routePath = getRoutePathFromFilePath(filePath, inputPath, config.framework);

    const params: { name: string; type: string; optional?: boolean; catchAll?: boolean; }[] = [];
    const dynamicSegments = routePath.match(/:([a-zA-Z0-9_]+)\*?/g);

    if (dynamicSegments) {
      dynamicSegments.forEach(segment => {
        const isCatchAll = segment.endsWith('*');
        const paramName = segment.substring(1).replace(/\*$/, '');
        params.push({
          name: paramName,
          type: isCatchAll ? 'string[]' : 'string',
          optional: isCatchAll,
          catchAll: isCatchAll
        });
      });
    }

    const queryParams = config.includeQueryParams ? extractQueryParams(filePath) : [];

    discoveredRoutes.push({ 
      filePath, 
      routePath, 
      params, 
      queryParams: queryParams.length > 0 ? queryParams : undefined 
    });

    console.log(`  ${relative(process.cwd(), filePath)} -> ${routePath}`);
    if (params.length > 0) {
      console.log(`    Params: ${params.map(p => `${p.name}${p.optional ? '?' : ''}${p.catchAll ? '[]' : ''}`).join(', ')}`);
    }
    if (queryParams.length > 0) {
      console.log(`    Query: ${queryParams.map(q => `${q.name}${q.optional ? '?' : ''}: ${q.type}`).join(', ')}`);
    }
  });

  console.log("\n--- Generating Routes ---");
  generateRoutesFile(discoveredRoutes, outputPath);

  if (config.generateTests) {
    generateTestFile(discoveredRoutes, outputPath);
  }

  if (config.routeAnalytics) {
    generateRouteAnalytics(discoveredRoutes, inputPath);
  }

  if (config.generateApiRoutes) {
    generateApiRoutes(discoveredRoutes, outputPath);
  }
}

function generateTestFile(routes: DiscoveredRouteEntry[], outputPath: string): void {
  const testPath = outputPath.replace(/\.ts$/, '.test.ts');
  let testContent = `// Auto-generated tests for routes\n`;
  testContent += `import { Routes } from './generated-routes';\n\n`;
  testContent += `describe('Routes', () => {\n`;

  routes.forEach(route => {
    const routeName = route.routePath === '/' ? 'home' : route.routePath.replace(/^\//, '').replace(/:([a-zA-Z0-9_]+)\*?/g, '$1');
    const testName = routeName.replace(/\//g, '.');

    if (route.params.length === 0 && (!route.queryParams || route.queryParams.length === 0)) {
      // Simple route test
      testContent += `  it('should generate ${testName} route', () => {\n`;
      testContent += `    expect(Routes.${testName}()).toBe('${route.routePath}');\n`;
      testContent += `  });\n\n`;
    } else if (route.params.length > 0) {
      // Route with parameters test
      testContent += `  it('should generate ${testName} route with params', () => {\n`;
      const mockParams: string[] = [];
      route.params.forEach(param => {
        if (param.catchAll) {
          mockParams.push(`${param.name}: ['test', 'path']`);
        } else {
          mockParams.push(`${param.name}: 'test-${param.name}'`);
        }
      });
      testContent += `    const result = Routes.${testName}({ ${mockParams.join(', ')} });\n`;
      testContent += `    expect(result).toContain('${route.routePath.split(':')[0]}');\n`;
      testContent += `  });\n\n`;
    }
  });

  testContent += `});\n`;

  require('fs').writeFileSync(testPath, testContent, 'utf-8');
  console.log(`\x1b[32mGenerated test file: ${testPath}\x1b[0m`);
}

function generateRouteAnalytics(routes: DiscoveredRouteEntry[], _inputPath: string): void {
  const analytics = {
    totalRoutes: routes.length,
    dynamicRoutes: routes.filter(r => r.params.length > 0).length,
    staticRoutes: routes.filter(r => r.params.length === 0).length,
    routesWithQueryParams: routes.filter(r => r.queryParams && r.queryParams.length > 0).length,
    nestedRoutes: routes.filter(r => (r.routePath.match(/\//g) || []).length > 1).length,
    catchAllRoutes: routes.filter(r => r.params.some(p => p.catchAll)).length,
    routeDepthDistribution: {} as Record<number, number>,
    parameterUsage: {} as Record<string, number>,
    fileTypes: {} as Record<string, number>
  };

  // Calculate route depth distribution
  routes.forEach(route => {
    const depth = (route.routePath.match(/\//g) || []).length;
    analytics.routeDepthDistribution[depth] = (analytics.routeDepthDistribution[depth] || 0) + 1;
  });

  // Calculate parameter usage
  routes.forEach(route => {
    route.params.forEach(param => {
      analytics.parameterUsage[param.name] = (analytics.parameterUsage[param.name] || 0) + 1;
    });
  });

  // Calculate file type distribution
  routes.forEach(route => {
    const ext = route.filePath.split('.').pop() || 'unknown';
    analytics.fileTypes[ext] = (analytics.fileTypes[ext] || 0) + 1;
  });

  const analyticsPath = join(process.cwd(), 'route-analytics.json');
  require('fs').writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2), 'utf-8');
  
  console.log('\n\x1b[33mRoute Analytics Generated:\x1b[0m');
  console.log(`   Total Routes: ${analytics.totalRoutes}`);
  console.log(`   Dynamic Routes: ${analytics.dynamicRoutes}`);
  console.log(`   Static Routes: ${analytics.staticRoutes}`);
  console.log(`   Routes with Query Params: ${analytics.routesWithQueryParams}`);
  console.log(`   Nested Routes: ${analytics.nestedRoutes}`);
  console.log(`   Catch-all Routes: ${analytics.catchAllRoutes}`);
  console.log(`   Report saved to: ${analyticsPath}`);
}

function generateApiRoutes(routes: DiscoveredRouteEntry[], outputPath: string): void {
  const apiRoutes = routes.filter(route => 
    route.filePath.includes('/api/') || 
    route.filePath.includes('/route.') ||
    route.filePath.match(/\/(GET|POST|PUT|DELETE|PATCH)\.(ts|js)$/)
  );

  if (apiRoutes.length === 0) {
    console.log('\x1b[33mWarning: No API routes detected\x1b[0m');
    return;
  }

  const apiPath = outputPath.replace('.ts', '-api.ts');
  let apiContent = `// Auto-generated API route helpers\n`;
  apiContent += `export const ApiRoutes = {\n`;

  apiRoutes.forEach(route => {
    const routeName = route.routePath === '/' ? 'root' : route.routePath.replace(/^\/api\//, '').replace(/\//g, '_').replace(/:([a-zA-Z0-9_]+)\*?/g, '$1');
    
    if (route.params.length === 0) {
      apiContent += `  ${routeName}: () => '${route.routePath}',\n`;
    } else {
      const paramTypes = route.params.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
      apiContent += `  ${routeName}: (params: { ${paramTypes} }) => \`${route.routePath.replace(/:([a-zA-Z0-9_]+)\*?/g, '${params.$1}')}\`,\n`;
    }
  });

  apiContent += `};\n\n`;

  // Add fetch helpers
  apiContent += `// Type-safe fetch helpers\n`;
  apiContent += `export const api = {\n`;
  apiContent += `  get: async <T>(url: string, options?: RequestInit): Promise<T> => {\n`;
  apiContent += `    const response = await fetch(url, { ...options, method: 'GET' });\n`;
  apiContent += `    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
  apiContent += `    return response.json();\n`;
  apiContent += `  },\n`;
  apiContent += `  post: async <T>(url: string, data?: any, options?: RequestInit): Promise<T> => {\n`;
  apiContent += `    const response = await fetch(url, {\n`;
  apiContent += `      ...options,\n`;
  apiContent += `      method: 'POST',\n`;
  apiContent += `      headers: { 'Content-Type': 'application/json', ...options?.headers },\n`;
  apiContent += `      body: data ? JSON.stringify(data) : undefined\n`;
  apiContent += `    });\n`;
  apiContent += `    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
  apiContent += `    return response.json();\n`;
  apiContent += `  },\n`;
  apiContent += `  put: async <T>(url: string, data?: any, options?: RequestInit): Promise<T> => {\n`;
  apiContent += `    const response = await fetch(url, {\n`;
  apiContent += `      ...options,\n`;
  apiContent += `      method: 'PUT',\n`;
  apiContent += `      headers: { 'Content-Type': 'application/json', ...options?.headers },\n`;
  apiContent += `      body: data ? JSON.stringify(data) : undefined\n`;
  apiContent += `    });\n`;
  apiContent += `    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
  apiContent += `    return response.json();\n`;
  apiContent += `  },\n`;
  apiContent += `  delete: async <T>(url: string, options?: RequestInit): Promise<T> => {\n`;
  apiContent += `    const response = await fetch(url, { ...options, method: 'DELETE' });\n`;
  apiContent += `    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);\n`;
  apiContent += `    return response.json();\n`;
  apiContent += `  }\n`;
  apiContent += `};\n`;

  require('fs').writeFileSync(apiPath, apiContent, 'utf-8');
  console.log(`\x1b[32mGenerated API routes file: ${apiPath}\x1b[0m`);
}

export function auditRoutes(config: Config, sourceDir: string, autoFix: boolean = false): void {
  const inputPath = resolve(config.input);
  const sourcePath = resolve(sourceDir);
  
  // Get all route files
  const allRouteFiles = getAllFilePaths(inputPath, config.excludePatterns);
  const discoveredRoutes: DiscoveredRouteEntry[] = [];

  allRouteFiles.forEach(filePath => {
    const routePath = getRoutePathFromFilePath(filePath, inputPath, config.framework);
    discoveredRoutes.push({ 
      filePath, 
      routePath, 
      params: [],
      queryParams: undefined 
    });
  });

  // Get all source files
  const sourceFiles = getAllFilePaths(sourcePath, ['**/node_modules/**', '**/dist/**', '**/.next/**']);
  
  // Track route usage
  const routeUsage: Record<string, { count: number; files: string[] }> = {};
  const potentialIssues: string[] = [];

  console.log('\x1b[33mAnalyzing route usage...\x1b[0m\n');

  // Initialize usage tracking
  discoveredRoutes.forEach(route => {
    routeUsage[route.routePath] = { count: 0, files: [] };
  });

  // Scan source files for route references
  sourceFiles.forEach(sourceFile => {
    try {
      const content = readFileSync(sourceFile, 'utf-8');
      
      discoveredRoutes.forEach(route => {
        // Look for route path references
        const routePattern = route.routePath.replace(/:/g, '\\w+');
        const regex = new RegExp(`['"\`]${routePattern}['"\`]`, 'g');
        const matches = content.match(regex);
        
        if (matches) {
          routeUsage[route.routePath].count += matches.length;
          if (!routeUsage[route.routePath].files.includes(sourceFile)) {
            routeUsage[route.routePath].files.push(sourceFile);
          }
        }

        // Look for magic string usage (potential issues)
        const magicStringRegex = /['"`]\/[^'"`\s]*['"`]/g;
        const magicStrings = content.match(magicStringRegex);
        if (magicStrings) {
          magicStrings.forEach(str => {
            const cleanStr = str.slice(1, -1); // Remove quotes
            if (cleanStr.startsWith('/') && !discoveredRoutes.some(r => r.routePath === cleanStr)) {
              potentialIssues.push(`Potential broken link in ${relative(process.cwd(), sourceFile)}: ${str}`);
            }
          });
        }
      });
    } catch (error) {
      console.warn(`\x1b[33mWarning: Could not read file: ${sourceFile}\x1b[0m`);
    }
  });

  // Report unused routes
  const unusedRoutes = Object.entries(routeUsage).filter(([_, usage]) => usage.count === 0);
  const mostUsedRoutes = Object.entries(routeUsage)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10);

  console.log('\x1b[36mRoute Usage Report:\x1b[0m');
  console.log(`   Total Routes: ${discoveredRoutes.length}`);
  console.log(`   Used Routes: ${Object.values(routeUsage).filter(u => u.count > 0).length}`);
  console.log(`   Unused Routes: ${unusedRoutes.length}`);
  console.log(`   Potential Issues: ${potentialIssues.length}\n`);

  if (unusedRoutes.length > 0) {
    console.log('\x1b[31mUnused Routes:\x1b[0m');
    unusedRoutes.forEach(([route]) => {
      const routeFile = discoveredRoutes.find(r => r.routePath === route)?.filePath;
      console.log(`   ${route} (${routeFile ? relative(process.cwd(), routeFile) : 'unknown'})`);
    });
    console.log();
  }

  if (mostUsedRoutes.length > 0) {
    console.log('\x1b[32mMost Used Routes:\x1b[0m');
    mostUsedRoutes.slice(0, 5).forEach(([route, usage]) => {
      console.log(`   ${route} (used ${usage.count} times)`);
    });
    console.log();
  }

  if (potentialIssues.length > 0) {
    console.log('\x1b[33mPotential Issues:\x1b[0m');
    potentialIssues.slice(0, 10).forEach(issue => {
      console.log(`   ${issue}`);
    });
    if (potentialIssues.length > 10) {
      console.log(`   ... and ${potentialIssues.length - 10} more`);
    }
    console.log();
  }

  // Generate audit report
  const auditReport = {
    timestamp: new Date().toISOString(),
    totalRoutes: discoveredRoutes.length,
    usedRoutes: Object.values(routeUsage).filter(u => u.count > 0).length,
    unusedRoutes: unusedRoutes.map(([route]) => route),
    mostUsedRoutes: mostUsedRoutes.slice(0, 10).map(([route, usage]) => ({ route, count: usage.count })),
    potentialIssues: potentialIssues,
    recommendations: [
      unusedRoutes.length > 0 ? `Consider removing ${unusedRoutes.length} unused routes` : null,
      potentialIssues.length > 0 ? `Fix ${potentialIssues.length} potential routing issues` : null,
      'Use the generated Routes helper to ensure type-safe navigation'
    ].filter(Boolean)
  };

  const auditPath = join(process.cwd(), 'route-audit.json');
  require('fs').writeFileSync(auditPath, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\x1b[32mAudit report saved to: ${auditPath}\x1b[0m`);

  if (autoFix && unusedRoutes.length > 0) {
    console.log('\n\x1b[33mAuto-fix mode enabled, but manual review is recommended for route removal.\x1b[0m');
    console.log('   Use the audit report to decide which routes to remove.');
  }
}

export function validateRoutes(config: Config, sourceDir: string, strictMode: boolean = false): void {
  const inputPath = resolve(config.input);
  const sourcePath = resolve(sourceDir);
  
  // Get all route files and discover routes
  const allRouteFiles = getAllFilePaths(inputPath, config.excludePatterns);
  const discoveredRoutes: DiscoveredRouteEntry[] = [];

  allRouteFiles.forEach(filePath => {
    const routePath = getRoutePathFromFilePath(filePath, inputPath, config.framework);
    const params: { name: string; type: string; optional?: boolean; catchAll?: boolean; }[] = [];
    
    // Extract dynamic parameters
    const dynamicSegments = routePath.match(/:([a-zA-Z0-9_]+)\*?/g);
    if (dynamicSegments) {
      dynamicSegments.forEach(segment => {
        const isCatchAll = segment.endsWith('*');
        const paramName = segment.substring(1).replace(/\*$/, '');
        params.push({
          name: paramName,
          type: isCatchAll ? 'string[]' : 'string',
          optional: isCatchAll,
          catchAll: isCatchAll
        });
      });
    }

    const queryParams = config.includeQueryParams ? extractQueryParams(filePath) : [];
    discoveredRoutes.push({ 
      filePath, 
      routePath, 
      params, 
      queryParams: queryParams.length > 0 ? queryParams : undefined 
    });
  });

  // Get all source files to validate
  const sourceFiles = getAllFilePaths(sourcePath, ['**/node_modules/**', '**/dist/**', '**/.next/**']);
  
  const validationErrors: string[] = [];
  const warnings: string[] = [];
  let totalRouteUsages = 0;

  console.log('\x1b[33mValidating route usage...\x1b[0m\n');

  sourceFiles.forEach(sourceFile => {
    try {
      const content = readFileSync(sourceFile, 'utf-8');
      const relativePath = relative(process.cwd(), sourceFile);
      
      // Check for Routes.* usage patterns
      const routeUsagePattern = /Routes\.([a-zA-Z0-9_.]+)(\([^)]*\))?/g;
      const matches = content.matchAll(routeUsagePattern);
      
      for (const match of matches) {
        totalRouteUsages++;
        const fullMatch = match[0];
        const routePath = match[1];
        const params = match[2];
        
        // Validate route exists
        const routeExists = discoveredRoutes.some(route => {
          const routeName = route.routePath === '/' ? 'home' : 
            route.routePath.replace(/^\//, '').replace(/:/g, '').replace(/\//g, '.');
          return routeName === routePath || routePath.startsWith(routeName + '.');
        });
        
        if (!routeExists) {
          validationErrors.push(`${relativePath}: Route '${routePath}' does not exist (${fullMatch})`);
        }
        
        // In strict mode, validate parameter usage
        if (strictMode && params) {
          const matchingRoute = discoveredRoutes.find(route => {
            const routeName = route.routePath === '/' ? 'home' : 
              route.routePath.replace(/^\//, '').replace(/:/g, '').replace(/\//g, '.');
            return routeName === routePath || routePath.startsWith(routeName + '.');
          });
          
          if (matchingRoute && matchingRoute.params.length > 0) {
            // Basic parameter validation (could be enhanced)
            if (!params.includes('{') && matchingRoute.params.some(p => !p.optional)) {
              warnings.push(`${relativePath}: Route '${routePath}' requires parameters but none provided`);
            }
          }
        }
      }
      
      // Check for magic string usage that could be replaced with Routes
      if (strictMode) {
        const magicStringPattern = /['"`]\/[a-zA-Z][^'"`\s]*['"`]/g;
        const magicStrings = content.matchAll(magicStringPattern);
        
        for (const match of magicStrings) {
          const pathString = match[0].slice(1, -1); // Remove quotes
          const couldBeRoute = discoveredRoutes.some(route => 
            route.routePath === pathString || route.routePath.startsWith(pathString)
          );
          
          if (couldBeRoute) {
            warnings.push(`${relativePath}: Consider using Routes helper instead of magic string: ${match[0]}`);
          }
        }
      }
      
    } catch (error) {
      console.warn(`\x1b[33mWarning: Could not read file: ${sourceFile}\x1b[0m`);
    }
  });

  // Report validation results
  console.log('\x1b[36mValidation Results:\x1b[0m');
  console.log(`   Total Route Usages: ${totalRouteUsages}`);
  console.log(`   Validation Errors: ${validationErrors.length}`);
  console.log(`   Warnings: ${warnings.length}\n`);

  if (validationErrors.length > 0) {
    console.log('\x1b[31mValidation Errors:\x1b[0m');
    validationErrors.slice(0, 10).forEach(error => {
      console.log(`   ${error}`);
    });
    if (validationErrors.length > 10) {
      console.log(`   ... and ${validationErrors.length - 10} more errors`);
    }
    console.log();
  }

  if (warnings.length > 0 && strictMode) {
    console.log('\x1b[33mWarnings:\x1b[0m');
    warnings.slice(0, 10).forEach(warning => {
      console.log(`   ${warning}`);
    });
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more warnings`);
    }
    console.log();
  }

  // Generate validation report
  const validationReport = {
    timestamp: new Date().toISOString(),
    totalRouteUsages,
    validationErrors: validationErrors.length,
    warnings: warnings.length,
    errors: validationErrors,
    warningsList: warnings,
    status: validationErrors.length === 0 ? 'PASSED' : 'FAILED'
  };

  const reportPath = join(process.cwd(), 'route-validation.json');
  require('fs').writeFileSync(reportPath, JSON.stringify(validationReport, null, 2), 'utf-8');
  console.log(`\x1b[32mValidation report saved to: ${reportPath}\x1b[0m`);

  if (validationErrors.length > 0) {
    console.log(`\n\x1b[31mValidation FAILED with ${validationErrors.length} errors\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\n\x1b[32mValidation PASSED - All routes are valid!\x1b[0m`);
  }
}
