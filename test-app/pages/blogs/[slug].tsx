import React from 'react';

export default function BlogPostPage() {
  const slug = "example-post";

  console.log(`--- Blog Post Page for slug: ${slug} ---`);
  return (
    <div>
      <h1>Blog Post: {slug}</h1>
      <p>This is a dummy blog post page.</p>
    </div>
  );
}