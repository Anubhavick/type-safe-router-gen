import React from 'react';
import { Routes } from '../../src/generated-routes';

export default function AboutPage() {
  const homePath = Routes.home();
  const aboutPath = Routes.about();
  const contactPath = Routes.contact();
  const productsPath = Routes.products();
  const myBlogPostPath = Routes.blogs.slug({ slug: 'my-first-post' });

  // Optional route usage (if generated correctly):
  const docsRootPath = Routes.docs.slug(); // Call without params for root or with empty array for no slugs
  const docsPagePath = Routes.docs.slug({ slug: ['getting-started', 'overview'] });

  // Search route usage
  const simpleSearchPath = Routes.search({ q: 'TypeScript' });
  const complexSearchPath = Routes.search({ q: 'Next.js' }, { page: 2, category: ['frontend', 'react'] });


  console.log('--- Routes from about.tsx ---');
  console.log(`Home Page Path: ${homePath}`);
  console.log(`About Page Path: ${aboutPath}`);
  console.log(`Contact Page Path: ${contactPath}`);
  console.log(`Products Page Path: ${productsPath}`);
  console.log(`Blog Post Path (my-first-post): ${myBlogPostPath}`);
  console.log(`Docs Root Path: ${docsRootPath}`);
  console.log(`Docs Page Path: ${docsPagePath}`);
  console.log(`Simple Search Path: ${simpleSearchPath}`);
  console.log(`Complex Search Path: ${complexSearchPath}`);
  console.log('---------------------------');

  return (
    <div>
      <h1>About Us</h1>
      <p>This is a dummy about page for testing the router generator.</p>
      <p>Generated Home Path: {homePath}</p>
      <p>Generated Blog Path: {myBlogPostPath}</p>
      <p>Generated Docs Path (root): {docsRootPath}</p>
      <p>Generated Docs Path (page): {docsPagePath}</p>
      <p>Generated Simple Search Path: {simpleSearchPath}</p>
      <p>Generated Complex Search Path: {complexSearchPath}</p>
    </div>
  );
}