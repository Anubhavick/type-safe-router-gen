// src/index.ts
// This is the main entry point for your Type-Safe Router Generator CLI.
// It orchestrates the file scanning and code generation process.

// Core Node.js modules for file system operations and path manipulation
import { readdirSync } from 'fs';
import { join, relative } from 'path';

// Import the code generation function from your generator module
import { generateRoutesFile } from './generator';

console.log("Hello from your router generator!");

/**
 * Defines the structure for a discovered route entry, including parameters.
 */
interface DiscoveredRouteEntry {
  filePath: string;
  routePath: string; // e.g., '/products/:id' or '/about'
  params: { name: string; type: string; }[]; // e.g., [{ name: 'slug', type: 'string' }]
}

/**
 * Calculates the clean URL path from a given file system path.
 * Handles static routes, index files, and dynamic segments.
 * @param filePath The absolute path to the route file (e.g., '/project/test-app/pages/about.tsx').
 * @param basePagesDir The absolute path to the root of the pages directory (e.g., '/project/test-app/pages').
 * @returns The calculated URL route path (e.g., '/about', '/products', '/blog/:slug').
 */
function getRoutePathFromFilePath(filePath: string, basePagesDir: string): string {
  // 1. Get the path relative to the 'pages' directory
  let routePath = relative(basePagesDir, filePath); // e.g., 'about.tsx', 'products/index.tsx', 'blog/[slug].tsx'

  // 2. Remove the file extension (e.g., .tsx, .ts, .jsx, .js)
  routePath = routePath.replace(/\.(tsx|ts|jsx|js)$/, ''); // becomes 'about', 'products/index', 'blog/[slug]'

  // 3. Convert [param] to :param for dynamic routes
  // This regex looks for patterns like '[name]' and replaces with ':name'
  routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1'); // becomes 'blog/:slug'

  // 4. Handle 'index' files:
  //    'index' should become '/' or remove the 'index' segment if it's a sub-index
  //    e.g., 'index' -> '/', 'products/index' -> '/products'
  if (routePath === 'index') {
    routePath = '/';
  } else if (routePath.endsWith('/index')) {
    routePath = routePath.slice(0, -6); // Remove '/index'
  }

  // 5. Ensure it starts with a '/' for consistency (unless it's already '/')
  if (!routePath.startsWith('/') && routePath !== '') {
    routePath = `/${routePath}`;
  }

  // If it's an empty string after processing (e.g., a bare basePagesDir), make it '/'
  if (routePath === '') {
      routePath = '/';
  }

  return routePath;
}

/**
 * Recursively finds all valid route file paths within a given directory.
 * @param dirPath The directory to scan.
 * @param fileList An array to accumulate found file paths.
 * @returns An array of absolute paths to route files.
 */
function getAllFilePaths(dirPath: string, fileList: string[] = []): string[] {
    const files = readdirSync(dirPath, { withFileTypes: true });

    files.forEach(file => {
        const fullPath = join(dirPath, file.name);
        if (file.isDirectory()) {
            getAllFilePaths(fullPath, fileList); // Recurse into subdirectories
        } else if (file.isFile() && /\.(tsx|ts|jsx|js)$/.test(file.name)) {
            fileList.push(fullPath); // Add only files with valid route extensions
        }
    });
    return fileList;
}

// --- MAIN EXECUTION LOGIC ---
const baseAppPath = join(process.cwd(), 'test-app');
const pagesDirPath = join(baseAppPath, 'pages');

console.log(`\nScanning pages in: ${pagesDirPath}`);

// Discover all route files and calculate their corresponding paths and parameters
const allRouteFiles = getAllFilePaths(pagesDirPath);
const discoveredRoutes: DiscoveredRouteEntry[] = []; // Use the defined interface

console.log("\nDiscovered Route Files:");
allRouteFiles.forEach(filePath => {
    const routePath = getRoutePathFromFilePath(filePath, pagesDirPath);

    // Extract dynamic parameters from the calculated routePath
    const params: { name: string; type: string; }[] = [];
    const dynamicSegments = routePath.match(/:([a-zA-Z0-9_]+)/g); // Find all :param patterns

    if (dynamicSegments) {
        dynamicSegments.forEach(segment => {
            const paramName = segment.substring(1); // Remove the leading ':'
            params.push({ name: paramName, type: 'string' }); // Default to 'string' type
        });
    }

    // Push the complete route data, including extracted parameters
    discoveredRoutes.push({ filePath, routePath, params });
    console.log(`  ${relative(process.cwd(), filePath)} -> ${routePath} (Params: ${params.map(p => p.name).join(', ') || 'None'})`);
});

console.log("\n--- END OF SCANNING ---\n");

// Call the code generation function with the discovered route data
generateRoutesFile(discoveredRoutes);