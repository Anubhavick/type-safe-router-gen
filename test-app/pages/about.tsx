// test-app/pages/about.tsx
import React from 'react';
import { Routes } from '../../src/generated-routes'; // Path relative to about.tsx

export default function AboutPage() {
  // Using the generated type-safe routes
  const homePath = Routes.home();
  const aboutPath = Routes.about();
  const contactPath = Routes.contact();
  const productsPath = Routes.products();

  // Example of using the dynamic route with a parameter
  const myBlogPostPath = Routes.blog({ slug: 'my-first-post' }); // Autocompletion and type-checking here!
  // const anotherPostPath = Routes.blog(); // <-- UNCOMMENT THIS LINE TO SEE A TYPE ERROR IN VS CODE!

  console.log('--- Routes from about.tsx ---');
  console.log(`Home Page Path: ${homePath}`);
  console.log(`About Page Path: ${aboutPath}`);
  console.log(`Contact Page Path: ${contactPath}`);
  console.log(`Products Page Path: ${productsPath}`);
  console.log(`Blog Post Path (my-first-post): ${myBlogPostPath}`);
  console.log('---------------------------');

  return (
    <div>
      <h1>About Us</h1>
      <p>This is a dummy about page for testing the router generator.</p>
      <p>Generated Home Path: {homePath}</p>
      <p>Generated Blog Path: {myBlogPostPath}</p>
    </div>
  );
}