import { generateRoutes } from './core';

console.log("Hello from your router generator!");

// Default configuration for backward compatibility
const defaultConfig = {
  input: './test-app/pages',
  output: './src/generated-routes.ts',
  framework: 'nextjs' as const,
  excludePatterns: ['**/api/**', '**/_*'],
  includeQueryParams: true,
  generateTests: false,
};

generateRoutes(defaultConfig);