// test-app/pages/blog/[slug].tsx
import React from 'react';

export default function BlogPostPage() {
  // In a real app, you'd get the slug from the router here (e.g., useRouter().query.slug)
  const slug = "example-post"; // Placeholder for demonstration

  console.log(`--- Blog Post Page for slug: ${slug} ---`);
  return (
    <div>
      <h1>Blog Post: {slug}</h1>
      <p>This is a dummy blog post page.</p>
    </div>
  );
}