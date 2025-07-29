// Example usage of the generated routes

import { Routes } from './generated-routes';

// ✅ Type-safe route navigation
console.log('Static routes:');
console.log(Routes.home());      // "/"
console.log(Routes.about());     // "/about"
console.log(Routes.contact());   // "/contact"
console.log(Routes.products());  // "/products"

console.log('\nDynamic routes:');
console.log(Routes.blogs.slug({ slug: 'my-first-post' })); 
// "/blogs/my-first-post"

console.log('\nOptional catch-all routes:');
console.log(Routes.docs.slug());                           
// "/docs/"
console.log(Routes.docs.slug({ slug: ['api', 'reference'] })); 
// "/docs/api/reference"

console.log('\nRoutes with query parameters:');
console.log(Routes.search({ q: 'typescript' }));           
// "/search?q=typescript"
console.log(Routes.search({ 
  q: 'react', 
  page: 2, 
  category: ['tutorial', 'beginner'] 
})); 
// "/search?q=react&page=2&category=tutorial&category=beginner"

// ❌ TypeScript will catch these errors at compile time:
// Routes.blogs.slug(); // Error: missing required 'slug' parameter
// Routes.blogs.slug({ id: 123 }); // Error: 'id' is not assignable to 'slug'
// Routes.search({}); // Error: missing required 'q' parameter
