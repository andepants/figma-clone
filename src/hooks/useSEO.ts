/**
 * @fileoverview Custom hook for managing SEO meta tags in React components.
 * Uses effect to update document head when component mounts.
 */

import { useEffect } from 'react';
import { updateSEO, type SEOConfig } from '@/lib/utils/seo';

/**
 * Hook to update SEO meta tags for a component/page
 * @param config - SEO configuration object
 *
 * @example
 * useSEO({
 *   title: 'About - CollabCanvas',
 *   description: 'Learn more about CollabCanvas',
 *   url: 'https://collabcanvas.app/about'
 * });
 */
export function useSEO(config: SEOConfig): void {
  useEffect(() => {
    updateSEO(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.title, config.description, config.url, config.image, config.keywords]);
}
