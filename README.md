# Type-Safe Router Generator

[![npm version](https://badge.fury.io/js/type-safe-router-gen.svg)](https://badge.fury.io/js/type-safe-router-gen)
[![npm downloads](https://img.shields.io/npm/dm/type-safe-router-gen.svg)](https://www.npmjs.com/package/type-safe-router-gen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A comprehensive CLI tool for generating type-safe navigation helpers in modern web frameworks. Generate type-safe route helpers, catch routing errors at compile time, analyze route performance, and audit your routing architecture with full IDE autocompletion support.**

```bash
npm install type-safe-router-gen
npx router-gen generate --analytics --generate-api
```

**NEW in v0.2:** Next.js App Router support, Route Analytics, API helpers, Performance analysis, and Route auditing.

---

## Quick Start

### 1. Install the Package

```bash
# Install globally
npm install -g type-safe-router-gen

# Or use npx (recommended)
npx router-gen --help
```

### 2. Generate Routes

```bash
# Generate routes from your pages directory
npx router-gen generate --input ./pages --output ./src/routes.ts

# Or use the default paths (looks for pages/ or app/ directories)
npx router-gen generate
```

### 3. Use Generated Routes

```typescript
import { Routes } from './src/routes';

// Type-safe navigation
const blogUrl = Routes.blog.slug({ slug: 'my-post' });        // "/blog/my-post"
const searchUrl = Routes.search({ q: 'typescript', page: 2 }); // "/search?q=typescript&page=2"

// TypeScript catches errors at compile time
Routes.blog.slug();                    // Error: missing required 'slug'
Routes.blog.slug({ id: 123 });         // Error: 'id' is not assignable to 'slug'
Routes.search({ invalid: 'param' });   // Error: 'invalid' is not a valid query param
```

---

## Supported File Structures

### Next.js (App Router & Pages Router)
```
# Pages Router
pages/
├── index.tsx              → Routes.home()
├── about.tsx              → Routes.about()
├── blog/
│   ├── [slug].tsx         → Routes.blog.slug({ slug: string })
│   └── index.tsx          → Routes.blog.index()
└── docs/
    └── [[...slug]].tsx    → Routes.docs.slug({ slug?: string[] })

# App Router (NEW)
app/
├── page.tsx               → Routes.home()
├── about/
│   └── page.tsx           → Routes.about()
├── blog/
│   ├── [slug]/
│   │   └── page.tsx       → Routes.blog.slug({ slug: string })
│   └── page.tsx           → Routes.blog.index()
└── (dashboard)/           # Route groups supported
    └── analytics/
        └── page.tsx       → Routes.analytics()
```

### Remix
```
app/routes/
├── _index.tsx             → Routes.home()
├── about.tsx              → Routes.about()
├── blog.$slug.tsx         → Routes.blog.slug({ slug: string })
└── docs.$.tsx             → Routes.docs.catchAll({ '*': string })
```

### Astro & SvelteKit
```
src/pages/                 # Astro
src/routes/                # SvelteKit
├── index.astro            → Routes.home()
├── about.astro            → Routes.about()
├── blog/
│   └── [slug].astro       → Routes.blog.slug({ slug: string })
```

---

## CLI Commands

### Generate Routes

```bash
# Basic generation
npx router-gen generate

# With custom paths and Next.js App Router
npx router-gen generate --input ./app --framework nextjs-app

# Generate with analytics and API helpers
npx router-gen generate --analytics --generate-api --generate-tests

# For different frameworks
npx router-gen generate --framework remix
npx router-gen generate --framework astro
npx router-gen generate --framework sveltekit
```

### Route Analytics & Performance

```bash
# Analyze route usage and generate insights
npx router-gen audit --source ./src

# Performance analysis for route optimization  
npx router-gen performance

# Watch mode with analytics
npx router-gen watch --analytics --generate-api
```

### Watch Mode (Auto-regenerate)

```bash
# Watch for file changes and auto-regenerate
npx router-gen watch

# Watch with all features enabled
npx router-gen watch --analytics --generate-api --generate-tests
```

### Route Auditing

```bash
# Find unused routes and potential issues
npx router-gen audit

# Audit with custom source directory
npx router-gen audit --source ./components --input ./pages

# Auto-fix mode (experimental)
npx router-gen audit --fix
```

### Initialize Configuration

```bash
# Create a router-gen.config.json file
npx router-gen init
```

---

## Configuration

Create a `router-gen.config.json` file in your project root:

```json
{
  "input": "./pages",
  "output": "./src/generated-routes.ts",
  "framework": "nextjs",
  "excludePatterns": ["**/api/**", "**/_*"],
  "includeQueryParams": true,
  "generateTests": false
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `input` | `string` | `"./pages"` | Directory containing your route files |
| `output` | `string` | `"./src/generated-routes.ts"` | Output file for generated routes |
| `framework` | `string` | `"nextjs"` | Framework type (`nextjs`, `nextjs-app`, `remix`, `astro`, `sveltekit`) |
| `excludePatterns` | `string[]` | `["**/api/**", "**/_*"]` | Glob patterns to exclude |
| `includeQueryParams` | `boolean` | `true` | Extract query parameters from route files |
| `generateTests` | `boolean` | `false` | Generate test files alongside routes |
| `generateApiRoutes` | `boolean` | `false` | Generate API route helpers with fetch utilities |
| `routeAnalytics` | `boolean` | `false` | Generate route analytics and usage reports |

---

---

## Query Parameters

Define query parameters in your route files using a `QueryParams` interface:

```typescript
// pages/search.tsx
export interface QueryParams {
  q: string;              // Required query param
  page?: number;          // Optional query param  
  category?: string[];    // Optional array query param
}

export default function SearchPage() {
  return <div>Search Page</div>;
}
```

Generated route:
```typescript
Routes.search({ 
  q: 'typescript',           // Required
  page: 2,                   // Optional
  category: ['tutorial']     // Optional array
}); 
// → "/search?q=typescript&page=2&category=tutorial"
```

---

## Advanced Features

### Route Analytics

Get comprehensive insights about your routing architecture:

```bash
npx router-gen generate --analytics
```

Generates `route-analytics.json` with:
- Total route count and distribution
- Dynamic vs static route analysis  
- Route depth and complexity metrics
- Parameter usage patterns
- Performance recommendations

```json
{
  "totalRoutes": 47,
  "dynamicRoutes": 12,
  "staticRoutes": 35,
  "nestedRoutes": 23,
  "routeDepthDistribution": { "1": 15, "2": 20, "3": 12 },
  "parameterUsage": { "id": 8, "slug": 5, "category": 3 }
}
```

### Route Auditing

Find unused routes, potential issues, and optimization opportunities:

```bash
npx router-gen audit
```

**What it detects:**
- Unused routes that can be removed
- Magic string usage (potential broken links)
- Route usage patterns across your codebase
- Most and least used routes

**Sample output:**
```
Route Usage Report:
   Total Routes: 47
   Used Routes: 42
   Unused Routes: 5
   Potential Issues: 3

Unused Routes:
   /admin/legacy -> pages/admin/legacy.tsx
   /temp/debug -> pages/temp/debug.tsx

Potential Issues:
   Potential broken link in src/components/Nav.tsx: "/old-path"
```

### Performance Analysis

Analyze route performance and get optimization suggestions:

```bash
npx router-gen performance
```

**Analyzes:**
- File size and bundle impact
- Code complexity metrics
- Dependency analysis
- Performance anti-patterns

**Sample output:**
```
Performance Analysis Results:
   Total Routes: 47
   Total Size: 892.3 KB
   Average Complexity: 6.2
   Routes with Issues: 8

Routes Needing Attention:
   pages/dashboard/analytics.tsx
     Size: 45.2 KB, Complexity: 15, Lines: 387
     • Large file size - consider code splitting
     • High complexity - consider refactoring
```

### API Route Helpers

Generate type-safe API helpers with built-in fetch utilities:

```bash
npx router-gen generate --generate-api
```

For API routes like:
```
pages/api/
├── users/
│   ├── [id].ts           # GET /api/users/:id
│   └── index.ts          # GET /api/users
└── posts/
    └── [slug].ts         # GET /api/posts/:slug
```

Generates `generated-routes-api.ts`:
```typescript
export const ApiRoutes = {
  users: {
    index: () => '/api/users',
    id: (params: { id: string }) => `/api/users/${params.id}`
  },
  posts: {
    slug: (params: { slug: string }) => `/api/posts/${params.slug}`
  }
};

// Type-safe fetch helpers
export const api = {
  get: async <T>(url: string, options?: RequestInit): Promise<T> => { /* ... */ },
  post: async <T>(url: string, data?: any, options?: RequestInit): Promise<T> => { /* ... */ },
  // ... put, delete
};

// Usage
const user = await api.get<User>(ApiRoutes.users.id({ id: '123' }));
const users = await api.post<User[]>(ApiRoutes.users.index(), { name: 'John' });
```

---

## Real-World Examples

### Next.js E-commerce Site

```
pages/
├── index.tsx                    → Routes.home()
├── products/
│   ├── index.tsx               → Routes.products.index()
│   ├── [id].tsx                → Routes.products.id({ id: string })
│   └── category/
│       └── [slug].tsx          → Routes.products.category.slug({ slug: string })
├── user/
│   ├── profile.tsx             → Routes.user.profile()
│   └── orders/
│       ├── index.tsx           → Routes.user.orders.index()
│       └── [orderId].tsx       → Routes.user.orders.orderId({ orderId: string })
└── search.tsx                  → Routes.search({ q: string, filters?: string[] })
```

Usage in components:
```typescript
import { Routes } from '../generated-routes';
import Link from 'next/link';

function ProductCard({ product }) {
  return (
    <Link href={Routes.products.id({ id: product.id })}>
      {product.name}
    </Link>
  );
}

function SearchForm() {
  const handleSearch = (query: string) => {
    router.push(Routes.search({ q: query }));
  };
}
```

### Remix Blog

```
app/routes/
├── _index.tsx                  → Routes.home()
├── blog._index.tsx             → Routes.blog.index()
├── blog.$slug.tsx              → Routes.blog.slug({ slug: string })
├── blog.admin.tsx              → Routes.blog.admin()
└── blog.admin.new.tsx          → Routes.blog.admin.new()
```

---

## Integration with Popular Tools

### React Router / Remix

```typescript
import { useNavigate } from '@remix-run/react';
import { Routes } from '~/generated-routes';

function MyComponent() {
  const navigate = useNavigate();
  
  const goToBlog = (slug: string) => {
    navigate(Routes.blog.slug({ slug }));
  };
}
```

### Next.js Router

```typescript
import { useRouter } from 'next/router';
import { Routes } from '../generated-routes';

function MyComponent() {
  const router = useRouter();
  
  const goToProduct = (id: string) => {
    router.push(Routes.products.id({ id }));
  };
}
```

### Astro

```astro
---
import { Routes } from '../generated-routes';
const blogUrl = Routes.blog.slug({ slug: 'my-post' });
---

<a href={blogUrl}>Read my blog post</a>
```

---

## Development Workflow

### 1. Setup Development Mode

```bash
# Terminal 1: Watch for route changes
npx router-gen watch

# Terminal 2: Run your dev server
npm run dev
```

### 2. Add New Routes

1. Create a new route file (e.g., `pages/blog/[slug].tsx`)
2. Routes are automatically regenerated
3. Import and use the new route: `Routes.blog.slug({ slug: 'new-post' })`

### 3. Refactoring Routes

When you rename or move route files:
1. Routes are automatically regenerated
2. TypeScript will show errors where old routes are used
3. Update your code using IDE autocompletion

---

## Best Practices

### 1. Consistent Query Parameters

```typescript
// Good: Consistent interface across similar routes
export interface SearchParams {
  q: string;
  page?: number;
  sort?: 'asc' | 'desc';
}
```

### 2. Descriptive Route Names

```
// Good: Clear hierarchy
pages/
├── dashboard/
│   ├── analytics/
│   │   └── [timeframe].tsx    → Routes.dashboard.analytics.timeframe()
│   └── settings/
│       └── profile.tsx        → Routes.dashboard.settings.profile()

// Avoid: Flat structure
pages/
├── dashboard-analytics-timeframe.tsx
└── dashboard-settings-profile.tsx
```

### 3. Type-Safe Redirects

```typescript
// Good: Type-safe redirects
const redirectToLogin = () => {
  return Response.redirect(Routes.auth.login());
};

// Avoid: Magic strings
const redirectToLogin = () => {
  return Response.redirect('/auth/login');
};
```

---

## Advanced Configuration

### Custom Route Transformations

```json
{
  "input": "./pages",
  "output": "./src/routes.ts",
  "framework": "nextjs",
  "excludePatterns": [
    "**/api/**",
    "**/_*",
    "**/components/**"
  ],
  "includeQueryParams": true,
  "generateTests": true
}
```

### Multiple Output Files

Generate routes for different parts of your app:

```bash
# Admin routes
npx router-gen generate --input ./pages/admin --output ./src/admin-routes.ts

# Public routes  
npx router-gen generate --input ./pages/public --output ./src/public-routes.ts
```

---

## Installation for Different Package Managers

### npm
```bash
npm install type-safe-router-gen
npx router-gen generate
```

### yarn
```bash
yarn add type-safe-router-gen
yarn router-gen generate
```

### pnpm
```bash
pnpm add type-safe-router-gen
pnpm router-gen generate
```

### bun
```bash
bun add type-safe-router-gen
bunx router-gen generate
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Inspired by the type-safety patterns in modern web frameworks
- Built for the developer community who values type safety and great DX
- Special thanks to all contributors and users providing feedback

---

**Built with care for the TypeScript community**