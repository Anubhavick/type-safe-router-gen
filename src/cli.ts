#!/usr/bin/env node

import { Command } from 'commander';
import { watch } from 'chokidar';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { generateRoutes, auditRoutes, getAllFilePaths, validateRoutes, Config } from './core';
import { analyzeRoutePerformance } from './performance';
import { generateRouteDocs } from './docs';

const defaultConfig: Config = {
  input: './pages',
  output: './src/generated-routes.ts',
  framework: 'nextjs',
  excludePatterns: ['**/api/**', '**/_*'],
  includeQueryParams: true,
  generateTests: false,
  generateApiRoutes: false,
  routeAnalytics: false,
};

function loadConfig(configPath?: string): Config {
  const configFiles = [
    configPath,
    'router-gen.config.js',
    'router-gen.config.ts',
    'router-gen.config.json'
  ].filter(Boolean) as string[];

  for (const file of configFiles) {
    const fullPath = resolve(file);
    if (existsSync(fullPath)) {
      try {
        let config;
        if (file.endsWith('.json')) {
          config = JSON.parse(readFileSync(fullPath, 'utf-8'));
        } else {
          // For .js/.ts files, we'd need dynamic import, for now just support JSON
          console.warn(`Config file ${file} found but only JSON configs are currently supported`);
          continue;
        }
        
        return { ...defaultConfig, ...config };
      } catch (error) {
        console.error(`Error loading config file ${file}:`, error);
      }
    }
  }

  return defaultConfig;
}

function createWatcher(inputDir: string, outputPath: string, config: Config) {
  const watcher = watch(inputDir, {
    ignored: config.excludePatterns,
    persistent: true,
    ignoreInitial: false
  });

    console.log(`\x1b[36mWatching ${inputDir} for changes...\x1b[0m`);
    console.log(`\x1b[36mOutput: ${outputPath}\x1b[0m`);
    console.log('Press Ctrl+C to stop watching\n');

    watcher.on('ready', () => {
      console.log('\x1b[32mInitial scan complete. Ready for changes!\x1b[0m');
      generateRoutes(config);
    });

    watcher.on('add', (path) => {
      console.log(`\x1b[32mFile added: ${path}\x1b[0m`);
      generateRoutes(config);
    });

    watcher.on('change', (path) => {
      console.log(`\x1b[33mFile changed: ${path}\x1b[0m`);
      generateRoutes(config);
    });

    watcher.on('unlink', (path) => {
      console.log(`\x1b[31mFile removed: ${path}\x1b[0m`);
      generateRoutes(config);
    });  return watcher;
}

const program = new Command();

program
  .name('type-safe-router-gen')
  .description('Generate type-safe route helpers for file-based routing')
  .version('1.0.0');

program
  .command('generate')
  .alias('gen')
  .description('Generate route helpers once')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-o, --output <path>', 'Output file path for generated routes')
  .option('-f, --framework <framework>', 'Framework type (nextjs|nextjs-app|remix|astro|sveltekit)', 'nextjs')
  .option('-c, --config <path>', 'Path to config file')
  .option('--no-query-params', 'Disable query parameter extraction')
  .option('--generate-tests', 'Generate test files')
  .option('--generate-api', 'Generate API route helpers')
  .option('--analytics', 'Generate route analytics report')
    .action((framework, options) => {
    try {
      const { generateRoutes } = require('./core');
      generateRoutes(options.input, options.output, framework, options.strict, options.config);
    } catch (error) {
      console.error('\x1b[31mError generating routes:', error instanceof Error ? error.message : String(error), '\x1b[0m');
      process.exit(1);
    }
  });

program
  .command('watch')
  .alias('w')
  .description('Watch for changes and regenerate routes automatically')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-o, --output <path>', 'Output file path for generated routes')
  .option('-f, --framework <framework>', 'Framework type (nextjs|nextjs-app|remix|astro|sveltekit)', 'nextjs')
  .option('-c, --config <path>', 'Path to config file')
  .option('--no-query-params', 'Disable query parameter extraction')
  .option('--generate-tests', 'Generate test files')
  .option('--generate-api', 'Generate API route helpers')
  .option('--analytics', 'Generate route analytics report')
  .action((options) => {
    const config = loadConfig(options.config);
    
    // Override config with CLI options
    if (options.input) config.input = options.input;
    if (options.output) config.output = options.output;
    if (options.framework) config.framework = options.framework;
    if (options.queryParams === false) config.includeQueryParams = false;
    if (options.generateTests) config.generateTests = true;
    if (options.generateApi) config.generateApiRoutes = true;
    if (options.analytics) config.routeAnalytics = true;

    const inputPath = resolve(config.input);
    const outputPath = resolve(config.output);

    if (!existsSync(inputPath)) {
      console.error(`\x1b[31mError: Input directory does not exist: ${inputPath}\x1b[0m`);
      process.exit(1);
    }

    const watcher = createWatcher(inputPath, outputPath, config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\x1b[33mStopping watcher...\x1b[0m');
      watcher.close();
      process.exit(0);
    });
  });

program
  .command('init')
  .description('Initialize a configuration file')
  .option('--format <format>', 'Config file format (json|js|ts)', 'json')
  .action((options) => {
    const configFileName = `router-gen.config.${options.format}`;
    const configPath = resolve(configFileName);

    if (existsSync(configPath)) {
      console.error(`\x1b[31mError: Config file already exists: ${configPath}\x1b[0m`);
      process.exit(1);
    }

    let configContent: string;
    if (options.format === 'json') {
      configContent = JSON.stringify(defaultConfig, null, 2);
    } else {
      configContent = `export default ${JSON.stringify(defaultConfig, null, 2)};`;
    }

    require('fs').writeFileSync(configPath, configContent, 'utf-8');
    console.log(`\x1b[32mCreated config file: ${configPath}\x1b[0m`);
  });

program
  .command('audit')
  .description('Audit routes for unused routes and potential issues')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-s, --source <path>', 'Source directory to scan for route usage', './src')
  .option('-c, --config <path>', 'Path to config file')
  .option('--fix', 'Automatically fix issues where possible')
  .action((options) => {
    const config = loadConfig(options.config);
    
    if (options.input) config.input = options.input;
    const sourceDir = options.source || './src';
    
    console.log('\x1b[36mAuditing routes...\x1b[0m');
    console.log(`\x1b[36mRoute files: ${resolve(config.input)}\x1b[0m`);
    console.log(`\x1b[36mSource files: ${resolve(sourceDir)}\x1b[0m\n`);
    
    auditRoutes(config, sourceDir, options.fix);
  });

program
  .command('performance')
  .alias('perf')
  .description('Analyze route performance and suggest optimizations')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-c, --config <path>', 'Path to config file')
  .action((options) => {
    const config = loadConfig(options.config);
    
    if (options.input) config.input = options.input;
    
    console.log('\x1b[33mAnalyzing route performance...\x1b[0m');
    console.log(`\x1b[36mRoute files: ${resolve(config.input)}\x1b[0m\n`);
    
    const routeFiles = getAllFilePaths(resolve(config.input), config.excludePatterns);
    
    analyzeRoutePerformance(routeFiles);
  });

program
  .command('validate')
  .alias('check')
  .description('Validate route usage across the codebase')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-s, --source <path>', 'Source directory to validate', './src')
  .option('-c, --config <path>', 'Path to config file')
  .option('--strict', 'Enable strict validation mode')
  .action((options) => {
    const config = loadConfig(options.config);
    
    if (options.input) config.input = options.input;
    const sourceDir = options.source || './src';
    
    console.log('\x1b[36mValidating route usage...\x1b[0m');
    console.log(`\x1b[36mRoute files: ${resolve(config.input)}\x1b[0m`);
    console.log(`\x1b[36mSource files: ${resolve(sourceDir)}\x1b[0m\n`);
    
    validateRoutes(config, sourceDir, options.strict);
  });

program
  .command('health')
  .description('Check overall route health and get recommendations')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-c, --config <path>', 'Path to config file')
  .action((options) => {
    const config = loadConfig(options.config);
    
    if (options.input) config.input = options.input;
    
    console.log('\x1b[36mChecking route health...\x1b[0m\n');
    
    // Generate all reports
    console.log('Running comprehensive analysis...\n');
    generateRoutes({ ...config, routeAnalytics: true });
    
    const routeFiles = getAllFilePaths(resolve(config.input), config.excludePatterns);
    analyzeRoutePerformance(routeFiles);
    
    auditRoutes(config, './src', false);
    
    console.log('\n\x1b[32mHealth check complete! Check the generated reports for detailed insights.\x1b[0m');
  });

program
  .command('docs')
  .description('Generate route documentation')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-o, --output <path>', 'Output file for documentation', './ROUTES.md')
  .option('-c, --config <path>', 'Path to config file')
  .action((options) => {
    const config = loadConfig(options.config);
    
    if (options.input) config.input = options.input;
    
    console.log('\x1b[36mGenerating route documentation...\x1b[0m');
    
    // Get all route files and discover routes (simplified version for docs)
    const routeFiles = getAllFilePaths(resolve(config.input), config.excludePatterns);
    const routes: any[] = [];
    
    routeFiles.forEach(filePath => {
      // This is a simplified version - in a real implementation, 
      // we'd reuse the route discovery logic from core.ts
      const routePath = filePath.includes('index') ? '/' : 
        filePath.replace(resolve(config.input), '').replace(/\.(tsx|ts|jsx|js)$/, '');
      
      routes.push({
        filePath,
        routePath: routePath.startsWith('/') ? routePath : '/' + routePath,
        params: [],
        queryParams: []
      });
    });
    
    generateRouteDocs(routes, options.output);
  });

program
  .command('migrate')
  .description('Migrate between different routing frameworks')
  .option('--from <framework>', 'Source framework', 'nextjs-pages')
  .option('--to <framework>', 'Target framework', 'nextjs-app')
  .option('--pages-dir <path>', 'Pages directory path', './pages')
  .option('--app-dir <path>', 'App directory path', './app')
  .action((options) => {
    console.log('\x1b[36mStarting migration process...\x1b[0m');
    
    if (options.from === 'nextjs-pages' && options.to === 'nextjs-app') {
      const { migrateToAppRouter } = require('./migrate');
      migrateToAppRouter(options.pagesDir, options.appDir);
    } else {
      console.log('\x1b[33mMigration between', options.from, 'and', options.to, 'is not yet supported.\x1b[0m');
      console.log('\x1b[33mCurrently supported migrations:\x1b[0m');
      console.log('  - nextjs-pages → nextjs-app');
    }
  });

// If no command is provided, default to generate
if (process.argv.length === 2) {
  program.parse(['node', 'cli.js', 'generate']);
} else {
  program.parse();
}
