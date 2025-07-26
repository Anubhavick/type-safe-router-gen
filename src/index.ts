// src/index.ts
// This is the main entry point for your Type-Safe Router Generator CLI.
// It orchestrates the file scanning and code generation process.

// Core Node.js modules for file system operations and path manipulation
import { readdirSync } from 'fs';
import { join, relative } from 'path';

// Import the code generation function from your generator module
import { generateRoutesFile } from './generator'; // <-- CRITICAL IMPORT

console.log("Hello from your router generator!");

/**
 * Calculates the clean URL path from a given file system path.
 * Handles static routes, index files, and prepares for dynamic segments.
 * @param filePath The absolute path to the route file (e.g., '/project/test-app/pages/about.tsx').
 * @param basePagesDir The absolute path to the root of the pages directory (e.g., '/project/test-app/pages').
 * @returns The calculated URL route path (e.g., '/about', '/products').
 */
function getRoutePathFromFilePath(filePath: string, basePagesDir: string): string {
  // 1. Get the path relative to the 'pages' directory
  let routePath = relative(basePagesDir, filePath); // e.g., 'about.tsx', 'products/index.tsx'

  // 2. Remove the file extension (e.g., .tsx, .ts, .jsx, .js)
  routePath = routePath.replace(/\.(tsx|ts|jsx|js)$/, ''); // becomes 'about', 'products/index'

  // 3. Handle 'index' files:
  //    'index' should become '/' or remove the 'index' segment if it's a sub-index
  //    e.g., 'index' -> '/', 'products/index' -> '/products'
  if (routePath === 'index') {
    routePath = '/';
  } else if (routePath.endsWith('/index')) {
    routePath = routePath.slice(0, -6); // Remove '/index'
  }

  // 4. Ensure it starts with a '/' for consistency (unless it's already '/')
  if (!routePath.startsWith('/') && routePath !== '') {
    routePath = `/${routePath}`;
  }

  // If it's an empty string after processing (e.g., an empty basePagesDir), make it '/'
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

// Discover all route files and calculate their corresponding paths
const allRouteFiles = getAllFilePaths(pagesDirPath);
const discoveredRoutes: { filePath: string; routePath: string }[] = [];

console.log("\nDiscovered Route Files:");
allRouteFiles.forEach(filePath => {
    const routePath = getRoutePathFromFilePath(filePath, pagesDirPath);
    discoveredRoutes.push({ filePath, routePath });
    console.log(`  ${relative(process.cwd(), filePath)} -> ${routePath}`);
});

console.log("\n--- END OF SCANNING ---\n");

// --- CRITICAL STEP: CALL THE CODE GENERATION FUNCTION ---
// This line takes the data collected above and writes the generated-routes.ts file.
generateRoutesFile(discoveredRoutes); // <-- THIS MUST BE PRESENT AND UNCOMMENTED!