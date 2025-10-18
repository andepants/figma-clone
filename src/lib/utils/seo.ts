/**
 * @fileoverview SEO utility functions for dynamic meta tag management.
 * Provides functions to update page title, meta tags, and Open Graph properties.
 */

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

/**
 * Updates the page title and meta tags dynamically
 * @param config - SEO configuration object
 */
export function updateSEO(config: SEOConfig): void {
  const {
    title = 'Canvas Icons - Real-time Collaborative Design Tool',
    description = 'Free real-time collaborative canvas for design teams. Create, share, and collaborate on designs instantly.',
    keywords = 'collaborative design tool, real-time canvas, figma alternative',
    image = 'https://collabcanvas.app/og-image.png',
    url = 'https://collabcanvas.app/',
    type = 'website',
  } = config;

  // Update title
  document.title = title;

  // Update or create meta tags
  updateMetaTag('name', 'description', description);
  updateMetaTag('name', 'keywords', keywords);

  // Open Graph tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:image', image);
  updateMetaTag('property', 'og:url', url);
  updateMetaTag('property', 'og:type', type);

  // Twitter tags
  updateMetaTag('property', 'twitter:title', title);
  updateMetaTag('property', 'twitter:description', description);
  updateMetaTag('property', 'twitter:image', image);

  // Update canonical URL
  updateCanonicalURL(url);
}

/**
 * Updates or creates a meta tag
 * @param attr - Attribute name (name or property)
 * @param attrValue - Attribute value
 * @param content - Meta tag content
 */
function updateMetaTag(
  attr: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  let element = document.querySelector(`meta[${attr}="${attrValue}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, attrValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Updates the canonical URL link tag
 * @param url - Canonical URL
 */
function updateCanonicalURL(url: string): void {
  let link = document.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', url);
}

