// test-app/pages/about.tsx
import React from 'react';
import { Routes } from '../../src/generated-routes'; // <-- This should now be resolved!

export default function AboutPage() {
  // --- NEW CODE TO USE GENERATED ROUTES ---
  const homePath = Routes.home();
  const aboutPath = Routes.about();
  const contactPath = Routes.contact();
  const productsPath = Routes.products();

  console.log('--- Routes from about.tsx ---');
  console.log(`Home Page Path: ${homePath}`);
  console.log(`About Page Path: ${aboutPath}`);
  console.log(`Contact Page Path: ${contactPath}`);
  console.log(`Products Page Path: ${productsPath}`);
  console.log('---------------------------');
  // --- END NEW CODE ---

  return (
    <div>
      <h1>About Us</h1>
      <p>This is a dummy about page for testing the router generator.</p>
      <p>Generated Home Path: {homePath}</p> {/* Example usage in JSX */}
    </div>
  );
}