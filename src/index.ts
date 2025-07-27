import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { generateRoutesFile } from './generator';

console.log("Hello from your router generator!");

interface DiscoveredRouteEntry {
  filePath: string;
  routePath: string;
  params: { name: string; type: string; optional?: boolean; catchAll?: boolean; }[];
  queryParams?: { name: string; type: string; optional?: boolean; }[];
}

function getRoutePathFromFilePath(filePath: string, basePagesDir: string): string {
  let routePath = relative(basePagesDir, filePath);
  routePath = routePath.replace(/\.(tsx|ts|jsx|js)$/, '');
  routePath = routePath.replace(/\[\[\.\.\.([^[\]]+)\]\]/g, ':$1*');
  routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');

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

function getAllFilePaths(dirPath: string, fileList: string[] = []): string[] {
    const files = readdirSync(dirPath, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = join(dirPath, file.name);
        if (file.isDirectory()) {
            getAllFilePaths(fullPath, fileList);
        } else if (file.isFile() && /\.(tsx|ts|jsx|js)$/.test(file.name)) {
            fileList.push(fullPath);
        }
    });
    return fileList;
}

function extractQueryParams(filePath: string): { name: string; type: string; optional?: boolean; }[] {
  const content = readFileSync(filePath, 'utf-8');
  const params: { name: string; type: string; optional?: boolean; }[] = [];

  const interfaceMatch = content.match(/export interface QueryParams\s*{(.*?)}/s);

  if (interfaceMatch && interfaceMatch[1]) {
    const properties = interfaceMatch[1].split(';').map(p => p.trim()).filter(p => p.length > 0);
    properties.forEach(prop => {
      const match = prop.match(/^(\w+)\s*(\?)?:\s*([\w\[\]]+)/); // Adjusted regex for types like string[]
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

const baseAppPath = join(process.cwd(), 'test-app');
const pagesDirPath = join(baseAppPath, 'pages');

console.log(`\nScanning pages in: ${pagesDirPath}`);

const allRouteFiles = getAllFilePaths(pagesDirPath);
const discoveredRoutes: DiscoveredRouteEntry[] = [];

console.log("\nDiscovered Route Files:");
allRouteFiles.forEach(filePath => {
    const routePath = getRoutePathFromFilePath(filePath, pagesDirPath);

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

    const queryParams = extractQueryParams(filePath);

    discoveredRoutes.push({ filePath, routePath, params, queryParams: queryParams.length > 0 ? queryParams : undefined });
    console.log(`  ${relative(process.cwd(), filePath)} -> ${routePath} (Params: ${params.map(p => `${p.name}${p.optional ? '?' : ''}${p.catchAll ? '[]' : ''}`).join(', ') || 'None'}) (Query: ${queryParams.map(q => `${q.name}${q.optional ? '?' : ''}: ${q.type}`).join(', ') || 'None'})`);
});

console.log("\n--- END OF SCANNING ---\n");

generateRoutesFile(discoveredRoutes);