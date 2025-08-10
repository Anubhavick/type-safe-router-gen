import { writeFileSync } from 'fs';

interface RouteDocEntry {
  filePath: string;
  routePath: string;
  params: { name: string; type: string; optional?: boolean; catchAll?: boolean; }[];
  queryParams?: { name: string; type: string; optional?: boolean; }[];
  description?: string;
}

export function generateRouteDocs(routes: RouteDocEntry[], outputPath: string = './ROUTES.md'): void {
  console.log('\x1b[33mGenerating route documentation...\x1b[0m');
  
  let docsContent = `# Route Documentation

Generated on: ${new Date().toISOString()}

## Overview

This project contains ${routes.length} routes across the following structure:

`;

  // Group routes by category
  const routeGroups: Record<string, RouteDocEntry[]> = {};
  
  routes.forEach(route => {
    const category = route.routePath === '/' ? 'Root' : 
      route.routePath.split('/')[1] || 'Other';
    
    if (!routeGroups[category]) {
      routeGroups[category] = [];
    }
    routeGroups[category].push(route);
  });

  // Generate table of contents
  docsContent += `## Table of Contents

`;
  Object.keys(routeGroups).sort().forEach(category => {
    docsContent += `- [${category.charAt(0).toUpperCase() + category.slice(1)}](#${category.toLowerCase()})\n`;
  });

  docsContent += `\n---\n\n`;

  // Generate sections for each category
  Object.keys(routeGroups).sort().forEach(category => {
    docsContent += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    
    const categoryRoutes = routeGroups[category];
    
    // Routes table
    docsContent += `| Route | File | Parameters | Query Params |\n`;
    docsContent += `|-------|------|------------|-------------|\n`;
    
    categoryRoutes.forEach(route => {
      const params = route.params.length > 0 ? 
        route.params.map(p => `\`${p.name}${p.optional ? '?' : ''}${p.catchAll ? '[]' : ''}: ${p.type}\``).join(', ') : 
        'None';
      
      const queryParams = route.queryParams && route.queryParams.length > 0 ? 
        route.queryParams.map(q => `\`${q.name}${q.optional ? '?' : ''}: ${q.type}\``).join(', ') : 
        'None';
      const filePath = `\`${route.filePath}\``;
      
      docsContent += `| \`${route.routePath}\` | ${filePath} | ${params} | ${queryParams} |\n`;
    });
    
    docsContent += `\n`;
    
    // Detailed route information
    categoryRoutes.forEach(route => {
      docsContent += `### \`${route.routePath}\`\n\n`;
      docsContent += `**File:** \`${route.filePath}\`\n\n`;
      
      if (route.params.length > 0) {
        docsContent += `**Parameters:**\n`;
        route.params.forEach(param => {
          docsContent += `- \`${param.name}\`: \`${param.type}\`${param.optional ? ' (optional)' : ''}${param.catchAll ? ' (catch-all)' : ''}\n`;
        });
        docsContent += `\n`;
      }
      
      if (route.queryParams && route.queryParams.length > 0) {
        docsContent += `**Query Parameters:**\n`;
        route.queryParams.forEach(param => {
          docsContent += `- \`${param.name}\`: \`${param.type}\`${param.optional ? ' (optional)' : ''}\n`;
        });
        docsContent += `\n`;
      }
      
      // Usage example
      docsContent += `**Usage:**\n\`\`\`typescript\n`;
      if (route.params.length > 0) {
        const exampleParams = route.params.map(p => {
          if (p.catchAll) {
            return `${p.name}: ['example', 'path']`;
          }
          return `${p.name}: 'example'`;
        }).join(', ');
        
        const routeName = route.routePath === '/' ? 'home' : route.routePath.replace(/^\//, '').replace(/:/g, '').replace(/\//g, '.');
        docsContent += `Routes.${routeName}({ ${exampleParams} })\n`;
      } else {
        const routeName = route.routePath === '/' ? 'home' : route.routePath.replace(/^\//, '').replace(/\//g, '.');
        docsContent += `Routes.${routeName}()\n`;
      }
      docsContent += `\`\`\`\n\n`;
      
      if (route.queryParams && route.queryParams.length > 0) {
        docsContent += `**With Query Parameters:**\n\`\`\`typescript\n`;
        const routeName = route.routePath === '/' ? 'home' : route.routePath.replace(/^\//, '').replace(/:/g, '').replace(/\//g, '.');
        const exampleQuery = route.queryParams.map(q => {
          if (q.type.includes('[]')) {
            return `${q.name}: ['example']`;
          }
          if (q.type === 'number') {
            return `${q.name}: 1`;
          }
          return `${q.name}: 'example'`;
        }).join(', ');
        
        if (route.params.length > 0) {
          const exampleParams = route.params.map(p => `${p.name}: 'example'`).join(', ');
          docsContent += `Routes.${routeName}({ ${exampleParams} }, { ${exampleQuery} })\n`;
        } else {
          docsContent += `Routes.${routeName}({ ${exampleQuery} })\n`;
        }
        docsContent += `\`\`\`\n\n`;
      }
      
      docsContent += `---\n\n`;
    });
  });

  // Add footer
  docsContent += `
## Quick Reference

### Available Commands

\`\`\`bash
# Generate routes
npx router-gen generate

# Watch for changes
npx router-gen watch

# Audit routes
npx router-gen audit

# Validate routes
npx router-gen validate

# Check route health
npx router-gen health

# Generate documentation
npx router-gen docs
\`\`\`

### Route Usage Patterns

\`\`\`typescript
import { Routes } from './generated-routes';

// Static routes
Routes.home()
Routes.about()

// Dynamic routes
Routes.blog.slug({ slug: 'my-post' })
Routes.user.profile({ userId: '123' })

// With query parameters
Routes.search({ q: 'typescript', page: 2 })
\`\`\`

---

*This documentation was auto-generated by [type-safe-router-gen](https://www.npmjs.com/package/type-safe-router-gen)*
`;

  writeFileSync(outputPath, docsContent, 'utf-8');
  console.log(`\x1b[32mRoute documentation generated: ${outputPath}\x1b[0m`);
}
