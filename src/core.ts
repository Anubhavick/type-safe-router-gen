import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { generateRoutesFile } from './generator';

export interface Config {
  input: string;
  output: string;
  framework: 'nextjs' | 'remix' | 'astro' | 'sveltekit';
  excludePatterns: string[];
  includeQueryParams: boolean;
  generateTests: boolean;
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

function getAllFilePaths(dirPath: string, excludePatterns: string[] = [], fileList: string[] = []): string[] {
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
        fileList.push(fullPath);
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
    console.error(`❌ Input directory does not exist: ${inputPath}`);
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
  console.log(`✅ Generated test file: ${testPath}`);
}
