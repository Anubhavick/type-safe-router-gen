#!/usr/bin/env node

import { Command } from 'commander';
import { watch } from 'chokidar';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { generateRoutes, Config } from './core';

const defaultConfig: Config = {
  input: './pages',
  output: './src/generated-routes.ts',
  framework: 'nextjs',
  excludePatterns: ['**/api/**', '**/_*'],
  includeQueryParams: true,
  generateTests: false,
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

  console.log(`👀 Watching ${inputDir} for changes...`);
  console.log(`📝 Output: ${outputPath}`);
  console.log('Press Ctrl+C to stop watching\n');

  watcher.on('ready', () => {
    console.log('🚀 Initial scan complete. Ready for changes!');
    generateRoutes(config);
  });

  watcher.on('add', (path) => {
    console.log(`➕ File added: ${path}`);
    generateRoutes(config);
  });

  watcher.on('change', (path) => {
    console.log(`📝 File changed: ${path}`);
    generateRoutes(config);
  });

  watcher.on('unlink', (path) => {
    console.log(`➖ File removed: ${path}`);
    generateRoutes(config);
  });

  return watcher;
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
  .option('-f, --framework <framework>', 'Framework type (nextjs|remix|astro|sveltekit)', 'nextjs')
  .option('-c, --config <path>', 'Path to config file')
  .option('--no-query-params', 'Disable query parameter extraction')
  .option('--generate-tests', 'Generate test files')
  .action((options) => {
    const config = loadConfig(options.config);
    
    // Override config with CLI options
    if (options.input) config.input = options.input;
    if (options.output) config.output = options.output;
    if (options.framework) config.framework = options.framework;
    if (options.queryParams === false) config.includeQueryParams = false;
    if (options.generateTests) config.generateTests = true;

    console.log('🚀 Generating routes...');
    console.log(`📁 Input: ${resolve(config.input)}`);
    console.log(`📝 Output: ${resolve(config.output)}`);
    console.log(`🎯 Framework: ${config.framework}\n`);

    generateRoutes(config);
  });

program
  .command('watch')
  .alias('w')
  .description('Watch for changes and regenerate routes automatically')
  .option('-i, --input <path>', 'Input directory containing route files')
  .option('-o, --output <path>', 'Output file path for generated routes')
  .option('-f, --framework <framework>', 'Framework type (nextjs|remix|astro|sveltekit)', 'nextjs')
  .option('-c, --config <path>', 'Path to config file')
  .option('--no-query-params', 'Disable query parameter extraction')
  .option('--generate-tests', 'Generate test files')
  .action((options) => {
    const config = loadConfig(options.config);
    
    // Override config with CLI options
    if (options.input) config.input = options.input;
    if (options.output) config.output = options.output;
    if (options.framework) config.framework = options.framework;
    if (options.queryParams === false) config.includeQueryParams = false;
    if (options.generateTests) config.generateTests = true;

    const inputPath = resolve(config.input);
    const outputPath = resolve(config.output);

    if (!existsSync(inputPath)) {
      console.error(`❌ Input directory does not exist: ${inputPath}`);
      process.exit(1);
    }

    const watcher = createWatcher(inputPath, outputPath, config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping watcher...');
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
      console.error(`❌ Config file already exists: ${configPath}`);
      process.exit(1);
    }

    let configContent: string;
    if (options.format === 'json') {
      configContent = JSON.stringify(defaultConfig, null, 2);
    } else {
      configContent = `export default ${JSON.stringify(defaultConfig, null, 2)};`;
    }

    require('fs').writeFileSync(configPath, configContent, 'utf-8');
    console.log(`✅ Created config file: ${configPath}`);
  });

// If no command is provided, default to generate
if (process.argv.length === 2) {
  program.parse(['node', 'cli.js', 'generate']);
} else {
  program.parse();
}
