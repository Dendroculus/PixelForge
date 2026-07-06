/**
 * Special route registry.
 *
 * Routes in this file are for non-tool pages such as coming soon,
 * not found, and other fallback/special-purpose pages.
 *
 * Keep wildcard routes last so they do not catch valid routes earlier.
 */
import React from 'react';

/**
 * Special and fallback routes.
 *
 * @type {{ path: string, component: React.LazyExoticComponent<React.ComponentType> }[]}
 */
const specialRoutes = [
  {
    path: '/coming-soon',
    component: React.lazy(() => import('../pages/Special/ComingSoon')),
  },
  {
    path: '*',
    component: React.lazy(() => import('../pages/Special/NotFound')),
  },
];

export default specialRoutes;
