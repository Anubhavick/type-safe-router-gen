# Type-Safe Frontend Router Generator 🚀

**A CLI tool to generate type-safe navigation helpers and route definitions for file-based frontend routers (e.g., Next.js, Remix, Astro).**

---

## 💡 Why This Project?

In modern web development, routing often relies on "magic strings" and manual path construction. This can lead to:
* **Runtime errors:** Simple typos in a URL string go unnoticed until the application breaks in production.
* **Poor developer experience:** No autocompletion for route paths or parameters in your IDE.
* **Difficult refactoring:** Changing a route path means manually updating every single usage across your codebase.

This generator aims to solve these problems by:
* **Providing compile-time safety:** Catch routing errors *before* deployment using TypeScript.
* **Enhancing developer experience:** Get autocompletion for all your defined routes and their required parameters.
* **Simplifying refactoring:** Let TypeScript guide you through updates when route definitions change.
* **Reducing boilerplate:** Generate functions that build correct URLs for you.

---

## ✨ Features (Planned / In Progress)

* **File-based Route Scanning:** Automatically discover routes by analyzing your project's file structure (e.g., `pages/` or `routes/` directories).
* **Dynamic Segment Detection:** Correctly identify and type dynamic route segments (e.g., `[id]`, `$slug`).
* **Type-Safe Navigation Functions:** Generate TypeScript functions (e.g., `Routes.productDetail({ id: '...' })`) that return the correct URL path.
* **Autocompletion in IDEs:** Leverage generated types for seamless autocompletion.
* **Framework Agnostic Design:** Initially targeting popular frameworks like Next.js and Remix, with future plans for broader compatibility.
* **Watch Mode:** Re-generate types automatically when route files change during development.
* **Query Parameter Typing:** (Future) Infer and type expected query parameters for routes.
* **Link Component Generation:** (Future) Generate framework-specific `<Link>` components with type-safe props.

---

## 🚧 Project Status: Early Development (Week 1 / Day 2)

This project is currently in its very initial stages. I am actively working on the foundational logic:
* **[COMPLETED]** Basic CLI setup with Node.js and TypeScript.
* **[IN PROGRESS]** File system scanning to read individual route files.
* **[NEXT]** Logic to correctly parse simple static and dynamic route paths from filenames.
* **[SOON]** Initial code generation for basic type-safe route functions.

Please note that functionality is limited at this moment, but the core vision is clear!

---

## 🛠️ Tech Stack

* **Node.js:** The runtime environment for the CLI.
* **TypeScript:** For robust type-safety and a better development experience.
* **`fs` & `path` modules:** Node.js built-in modules for file system interactions.
* *(Future additions might include: `chokidar` for watch mode, `ts-morph` or `TypeScript compiler API` for advanced AST parsing, etc.)*

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or Yarn (package manager)

### Installation

Currently, the tool is not published to npm. To use it:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Anubhavick/type-safe-router-gen.git
    cd type-safe-router-gen
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Usage (Work in Progress)

Once the core parsing and generation logic is implemented, usage will involve:

```bash
# To run the development version of the generator:
npm start

# Or, to build the production version (not yet fully functional for output):
npm run build