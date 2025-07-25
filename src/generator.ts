// src/generator.ts
// This file is responsible for taking the parsed route data and generating
// the actual type-safe route helper functions.

import { writeFileSync } from 'fs'; // For writing the generated file
import { join } from 'path';        // For constructing the output file path

// Define the shape of the route data we expect to receive
interface RouteData {
  filePath: string;
  routePath: string; // e.g., '/products/:id' or '/about'
}

/**
 * Generates a TypeScript file with type-safe route helper functions.
 * @param routes An array of discovered route data.
 */
export function generateRoutesFile(routes: RouteData[]) {
  // Define the path where the generated file will be saved
  // It will be saved inside your 'src' directory for now.
  const outputPath = join(process.cwd(), 'src', 'generated-routes.ts');

  // Start building the content of the generated file
  let fileContent = `// This file is auto-generated by your-router-gen. Do not modify.\n\n`;
  fileContent += `/**
 * Type-safe route helpers generated from your file-based routing.
 * Use these functions for safe navigation and link creation.
 */\n`; // <--- This is the missing part of the string in your screenshot

  // Loop through each discovered route and add it to the 'Routes' object
  routes.forEach(route => {
    // Basic naming convention for the generated function:
    // - '/' becomes 'home'
    // - '/about' becomes 'about'
    // - '/products/index' becomes 'products' (from previous step's path calculation)
    // - '/products/:id' would become 'products.id' (future task)
    const routeName = route.routePath === '/'
                      ? 'home'
                      : route.routePath.replace(/^\//, '').replace(/\//g, '.').replace(/\//g, '.'); // Replace all slashes with dots for nested naming

    fileContent += `  ${routeName}: () => "${route.routePath}",\n`;
  });

  fileContent += `};\n\n`;

  // Optional: Add basic TypeScript types for better developer experience
  fileContent += `/**
 * Union type of all generated route names.
 */\n`;
  fileContent += `export type RouteNames = keyof typeof Routes;\n\n`;
  fileContent += `/**
 * Union type of all generated route paths (the actual URL strings).
 */\n`;
  fileContent += `export type RoutePaths = ReturnType<typeof Routes[RouteNames]>;\n`;


  // Write the generated content to the file system
  try {
    writeFileSync(outputPath, fileContent, 'utf-8'); // <--- This line uses writeFileSync
    console.log(`\nSUCCESS: Generated routes file at: ${outputPath}`);
  } catch (error) {
    console.error(`\nERROR: Could not generate routes file: ${outputPath}`);
    if (error instanceof Error) {
      console.error(`Reason: ${error.message}`);
    } else {
      console.error(error);
    }
  }
}