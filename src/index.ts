import { readdirSync } from 'fs';
import { join, relative } from 'path';
import { generateRoutesFile } from './generator';

console.log("Hello from your router generator!");

interface DiscoveredRouteEntry {
  filePath: string;
  routePath: string;
  params: { name: string; type: string; optional?: boolean; catchAll?: boolean; }[];
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

    discoveredRoutes.push({ filePath, routePath, params });
    console.log(`  ${relative(process.cwd(), filePath)} -> ${routePath} (Params: ${params.map(p => `${p.name}${p.optional ? '?' : ''}${p.catchAll ? '[]' : ''}`).join(', ') || 'None'})`);
});

console.log("\n--- END OF SCANNING ---\n");

generateRoutesFile(discoveredRoutes);