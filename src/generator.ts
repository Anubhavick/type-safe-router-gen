import { writeFileSync } from 'fs';
import { join } from 'path';

interface RouteData {
  filePath: string;
  routePath: string;
  params: { name: string; type: string; optional?: boolean; catchAll?: boolean; }[];
  queryParams?: { name: string; type: string; optional?: boolean; }[];
}

function generateNestedRoutes(obj: any, indent: number): string {
  const spaces = '  '.repeat(indent);
  let result = '';

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // This is a route function
      result += `${spaces}${key}: ${value},\n`;
    } else {
      // This is a nested object
      result += `${spaces}${key}: {\n`;
      result += generateNestedRoutes(value, indent + 1);
      result += `${spaces}},\n`;
    }
  }

  return result;
}

export function generateRoutesFile(routes: RouteData[], outputPath?: string) {
  const finalOutputPath = outputPath || join(process.cwd(), 'src', 'generated-routes.ts');
  let fileContent = `// This file is auto-generated by your-router-gen. Do not modify.\n\n`;
  fileContent += `/**
 * Type-safe route helpers generated from your file-based routing.
 * Use these functions for safe navigation and link creation.
 */\n`;

  // Build nested route structure
  const routeStructure: any = {};

  routes.forEach(route => {
    const routeName = route.routePath === '/'
                      ? 'home'
                      : route.routePath
                          .replace(/^\//, '')
                          .replace(/:([a-zA-Z0-9_]+)\*?/g, '$1');

    let functionArgs: string[] = [];
    let pathConstruction = route.routePath;

    if (route.params.length > 0) {
      const paramList = route.params.map(p => {
        let paramType = p.type;
        if (p.catchAll) {
            paramType = 'string[]';
        }
        return `${p.name}${p.optional ? '?' : ''}: ${paramType}`;
      }).join(', ');
      functionArgs.push(`params${route.params.every(p => p.optional) ? '?' : ''}: { ${paramList} }`);

      route.params.forEach(p => {
          if (p.catchAll) {
              pathConstruction = pathConstruction.replace(`:${p.name}*`, `\${params?.${p.name} ? params.${p.name}.join('/') : ''}`);
          } else {
              pathConstruction = pathConstruction.replace(`:${p.name}`, `\${params.${p.name}}`);
          }
      });
    }

    if (route.queryParams && route.queryParams.length > 0) {
      const queryParamList = route.queryParams.map(q => `${q.name}${q.optional ? '?' : ''}: ${q.type}`).join(', ');
      functionArgs.push(`query${route.queryParams.every(q => q.optional) ? '?' : ''}: { ${queryParamList} }`);

      // Generate query string construction
      const queryParts: string[] = [];
      route.queryParams.forEach(q => {
        if (q.type.endsWith('[]')) {
          queryParts.push(`query.${q.name} && query.${q.name}.length > 0 ? '&${q.name}=' + query.${q.name}.map(val => encodeURIComponent(val)).join('&${q.name}=') : ''`);
        } else {
          queryParts.push(`query.${q.name} ? '&${q.name}=' + encodeURIComponent(query.${q.name}) : ''`);
        }
      });
      
      const queryConstruction = `\${[${queryParts.join(', ')}].join('').replace(/^&/, '?')}`;
      pathConstruction += queryConstruction;
    }

    // Build nested structure
    const parts = routeName.split('/');
    let current = routeStructure;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    const finalKey = parts[parts.length - 1];
    current[finalKey] = `(${functionArgs.join(', ')}) => \`${pathConstruction}\``;
  });

  // Generate the Routes object with proper nesting
  fileContent += `export const Routes = {\n`;
  fileContent += generateNestedRoutes(routeStructure, 1);
  fileContent += `};\n\n`;

  fileContent += `/**
 * Union type of all generated route names.
 */\n`;
  fileContent += `export type RouteNames = keyof typeof Routes;\n\n`;
  fileContent += `/**
 * Union type of all generated route paths (the actual URL strings).
 */\n`;
  fileContent += `export type RoutePaths = string;\n`;


  try {
    writeFileSync(finalOutputPath, fileContent, 'utf-8');
    console.log(`\nSUCCESS: Generated routes file at: ${finalOutputPath}`);
  } catch (error) {
    console.error(`\nERROR: Could not generate routes file: ${finalOutputPath}`);
    if (error instanceof Error) {
      console.error(`Reason: ${error.message}`);
    } else {
      console.error(error);
    }
  }
}