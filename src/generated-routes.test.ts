// Auto-generated tests for routes
import { Routes } from './generated-routes';

describe('Routes', () => {
  it('should generate about route', () => {
    expect(Routes.about()).toBe('/about');
  });

  it('should generate blogs.slug route with params', () => {
    const result = Routes.blogs.slug({ slug: 'test-slug' });
    expect(result).toContain('/blogs/');
  });

  it('should generate contact route', () => {
    expect(Routes.contact()).toBe('/contact');
  });

  it('should generate docs.slug route with params', () => {
    const result = Routes.docs.slug({ slug: ['test', 'path'] });
    expect(result).toContain('/docs/');
  });

  it('should generate home route', () => {
    expect(Routes.home()).toBe('/');
  });

  it('should generate products route', () => {
    expect(Routes.products()).toBe('/products');
  });

});
