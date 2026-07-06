/**
 * Utility route registry.
 *
 * Routes in this file are for supporting image tools that do not fit directly
 * into AI features, smart editing, or optimization.
 *
 * Examples include watermarking, palette extraction, and other focused helpers.
 */

import React from 'react';

/**
 * Utility tool routes.
 *
 * @type {{ path: string, component: React.LazyExoticComponent<React.ComponentType> }[]}
 */
const utilityRoutes = [
  {
    path: '/watermark-adder',
    component: React.lazy(() => import('../pages/Utilities/WatermarkAdder')),
  },
  {
    path: '/color-palette',
    component: React.lazy(() => import('../pages/Utilities/ColorPalette')),
  },
];

export default utilityRoutes;