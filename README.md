# Type-Safe Frontend Router Generator 🚀

**A powerful CLI tool that generates type-safe navigation helpers and route definitions for file-based frontend routers (e.g., Next.js, Remix, Astro). Say goodbye to magic strings and runtime routing errors!**

---

## 💡 Why This Project?

In complex web applications, managing routes manually becomes a significant source of bugs and developer frustration. This generator addresses these pain points by:

* **Compile-time Safety:** Catches routing errors and invalid parameter usage *before* deployment, leveraging TypeScript's robust type system.
* **Enhanced Developer Experience:** Provides intelligent autocompletion for all your defined routes, their required parameters, and supported query parameters directly in your IDE.
* **Simplified Refactoring:** When route definitions change, TypeScript guides you through the necessary updates in your codebase.
* **Reduced Boilerplate:** Automatically generates functions to construct correct and safe URLs, eliminating tedious string concatenation.

---

## ✨ Features

Your generator currently supports:

* **Automatic Route Discovery:** Scans your `pages` or `routes` directory recursively to find all route files.
* **Static Route Generation:** Generates simple functions for static paths (e.g., `/about` -> `Routes.about()`).
* **Required Dynamic Segments:** Correctly identifies and types required dynamic parameters (e.g., `blogs/[slug].tsx` -> `Routes.blogs.slug({ slug: string })`).
* **Optional Catch-All Dynamic Segments:** Handles optional and array-based dynamic routes (e.g., `docs/[[...slug]].tsx` -> `Routes.docs.slug({ slug?: string[] })`).
* **Type-Safe Query Parameters:** Extracts `QueryParams` interfaces from your route files to generate functions that accept typed query objects (e.g., `search.tsx` with `QueryParams` -> `Routes.search({ q: string }, { page?: number })`).
* **Intelligent Naming:** Converts file paths like `blogs/[slug].tsx` into valid, intuitive TypeScript object keys like `Routes.blogs.slug`.
* **Automatic File Generation:** Creates or updates `src/generated-routes.ts` on demand.

---

## 🚧 Project Status: Core Functionality Complete!

The generator now includes robust handling for various route types (static, dynamic, optional catch-all) and query parameters. The core logic for scanning, parsing, and code generation is solid.

**Next steps will focus on:**
* Making the CLI more configurable (input/output paths).
* Implementing a `--watch` mode for automatic regeneration.
* Adding comprehensive tests.
* Preparing for distribution (e.g., `npm run build` and `bin` entry).

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