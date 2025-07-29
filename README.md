# Type-Safe Router Generator 🚀

**Generate type-safe navigation helpers for your file-based routing. Stop using magic strings, catch routing errors at compile time, and enjoy full IDE autocompletion for all your routes.**

```bash
npm install type-safe-router-gen
npx router-gen generate
```

---

## 🚀 Quick Start

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

// ✅ Type-safe navigation
const blogUrl = Routes.blog.slug({ slug: 'my-post' });        // "/blog/my-post"
const searchUrl = Routes.search({ q: 'typescript', page: 2 }); // "/search?q=typescript&page=2"

// ❌ TypeScript catches errors at compile time
Routes.blog.slug();                    // Error: missing required 'slug'
Routes.blog.slug({ id: 123 });         // Error: 'id' is not assignable to 'slug'
Routes.search({ invalid: 'param' });   // Error: 'invalid' is not a valid query param
```

---

## 📁 Supported File Structures

### Next.js (App Router & Pages Router)
```
pages/
├── index.tsx              → Routes.home()
├── about.tsx              → Routes.about()
├── blog/
│   ├── [slug].tsx         → Routes.blog.slug({ slug: string })
│   └── index.tsx          → Routes.blog.index()
└── docs/
    └── [[...slug]].tsx    → Routes.docs.slug({ slug?: string[] })
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

## 🛠 CLI Commands

### Generate Routes

```bash
# Basic generation
npx router-gen generate

# With custom paths
npx router-gen generate --input ./app/routes --output ./lib/routes.ts

# For different frameworks
npx router-gen generate --framework remix
npx router-gen generate --framework astro
npx router-gen generate --framework sveltekit
```

### Watch Mode (Auto-regenerate)

```bash
# Watch for file changes and auto-regenerate
npx router-gen watch

# Watch with custom paths
npx router-gen watch --input ./pages --output ./src/routes.ts
```

### Generate Tests

```bash
# Generate routes with test files
npx router-gen generate --generate-tests
```

### Initialize Configuration

```bash
# Create a router-gen.config.json file
npx router-gen init
```

---

## ⚙️ Configuration

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
| `framework` | `string` | `"nextjs"` | Framework type (`nextjs`, `remix`, `astro`, `sveltekit`) |
| `excludePatterns` | `string[]` | `["**/api/**", "**/_*"]` | Glob patterns to exclude |
| `includeQueryParams` | `boolean` | `true` | Extract query parameters from route files |
| `generateTests` | `boolean` | `false` | Generate test files alongside routes |

---

---

## 💡 Query Parameters

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

## 🎯 Real-World Examples

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

## 🔄 Integration with Popular Tools

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

## 🧪 Development Workflow

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

## 🚀 Best Practices

### 1. Consistent Query Parameters

```typescript
// ✅ Good: Consistent interface across similar routes
export interface SearchParams {
  q: string;
  page?: number;
  sort?: 'asc' | 'desc';
}
```

### 2. Descriptive Route Names

```
// ✅ Good: Clear hierarchy
pages/
├── dashboard/
│   ├── analytics/
│   │   └── [timeframe].tsx    → Routes.dashboard.analytics.timeframe()
│   └── settings/
│       └── profile.tsx        → Routes.dashboard.settings.profile()

// ❌ Avoid: Flat structure
pages/
├── dashboard-analytics-timeframe.tsx
└── dashboard-settings-profile.tsx
```

### 3. Type-Safe Redirects

```typescript
// ✅ Good: Type-safe redirects
const redirectToLogin = () => {
  return Response.redirect(Routes.auth.login());
};

// ❌ Avoid: Magic strings
const redirectToLogin = () => {
  return Response.redirect('/auth/login');
};
```

---

## 🔧 Advanced Configuration

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

## 📦 Installation for Different Package Managers

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

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the type-safety patterns in modern web frameworks
- Built for the developer community who values type safety and great DX
- Special thanks to all contributors and users providing feedback

---

**Made with ❤️ for the TypeScript community**

---

## 🛠️ Tech Stack

* **Node.js:** The runtime environment.
* **TypeScript:** For building a robust and type-safe generator.
* **Node.js `fs` & `path` modules:** For efficient file system interactions and path manipulation.
* **Regular Expressions:** Used for parsing route patterns and extracting parameters.

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or Yarn (package manager)

### Installation

Currently, the tool is not published to npm. To set up and run:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)[Your GitHub Username]/type-safe-router-gen.git
    cd type-safe-router-gen
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Ensure your dummy `test-app` structure is in place:**
    ```
    type-safe-router-gen/
    ├── src/
    │   ├── generator.ts
    │   └── index.ts
    └── test-app/
        └── pages/
            ├── about.tsx
            ├── blog/
            │   └── [slug].tsx
            ├── contact.tsx
            ├── docs/
            │   └── [[...slug]].tsx
            ├── index.tsx
            ├── products/
            │   └── index.tsx
            └── search.tsx
    ```

### Usage

To run the generator and update your `src/generated-routes.ts` file:

```bash
npm start
```

This command will scan your test-app/pages directory and generate the type-safe routing helpers.

Example Usage in Your Application Code (test-app/pages/about.tsx):
After running npm start, you can import and use the generated Routes object in your application code

`
// test-app/pages/about.tsx
import { Routes } from '../../src/generated-routes';

// Static routes
const homePath = Routes.home();             // Output: "/"
const aboutPath = Routes.about();           // Output: "/about"

// Required dynamic routes
const blogPostPath = Routes.blogs.slug({ slug: 'my-first-post' });
// Output: "/blogs/my-first-post"
// Try: Routes.blogs.slug() -> TypeScript error: "Expected 1 arguments, but got 0."

// Optional catch-all dynamic routes
const docsRootPath = Routes.docs.slug(); // Output: "/docs/"
const docsPagePath = Routes.docs.slug({ slug: ['getting-started', 'overview'] });
// Output: "/docs/getting-started/overview"

// Routes with Query Parameters
const simpleSearch = Routes.search({ q: 'TypeScript' });
// Output: "/search?q=TypeScript"
const complexSearch = Routes.search(
  { q: 'Next.js' },
  { page: 2, category: ['frontend', 'react'] }
);
// Output: "/search?q=Next.js&page=2&category=frontend&category=react"`

##👋 Contributing
Contributions are highly welcome! Whether it's feature ideas, bug reports, or code contributions, your input is valuable.
Fork the repository.
Create your feature branch `(git checkout -b feature/your-feature-name)`.
Commit your changes `(git commit -m 'feat: Add your amazing feature')`.
Push to the branch `(git push origin feature/your-feature-name).`
Open a Pull Request.
Please open an issue first to discuss major changes you would like to make.

##📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

##🤝 Connect with Me
anubhav.ickk@gmail.com