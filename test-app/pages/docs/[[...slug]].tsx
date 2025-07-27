import React from 'react';

export default function DocsPage() {
  const slug = 'getting-started/overview';

  console.log(`--- Docs Page for slug: ${slug || '(root)'} ---`);
  return (
    <div>
      <h1>Documentation: {slug || 'Overview'}</h1>
      <p>This is a dummy documentation page.</p>
    </div>
  );
}