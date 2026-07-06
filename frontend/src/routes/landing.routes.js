/**
 * Landing route registry.
 *
 * Routes in this file are for public landing or home pages.
 */

import React from 'react';

/**
 * Landing page routes.
 *
 * @type {{ path: string, component: React.LazyExoticComponent<React.ComponentType> }[]}
 */
const landingRoutes = [
  {
    path: '/',
    component: React.lazy(() => import('../pages/Landing/Home')),
  }
];

export default landingRoutes;