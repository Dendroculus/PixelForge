/**
 * Optimization route registry.
 *
 * Routes in this file are for tools focused on reducing file size,
 * changing image formats, or cleaning file metadata.
 *
 * Most optimization tools are client-side and should stay separate from
 * AI feature routes to keep the route structure easy to scan.
 */

import React from 'react';

/**
 * Image optimization routes.
 *
 * @type {{ path: string, component: React.LazyExoticComponent<React.ComponentType> }[]}
 */
const optimizeRoutes = [
  {
    path: '/compress-image',
    component: React.lazy(() => import('../pages/Optimize/CompressImage')),
  },
  {
    path: '/convert-format',
    component: React.lazy(() => import('../pages/Optimize/ConvertFormat')),
  },
  {
    path: '/metadata',
    component: React.lazy(() => import('../pages/Optimize/MetadataWorkspace')),
  },
];

export default optimizeRoutes;