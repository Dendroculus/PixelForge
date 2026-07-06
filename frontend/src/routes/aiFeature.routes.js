/**
 * AI feature route registry.
 *
 * Routes in this file are for tools that depend on the backend AI pipeline,
 * cloud upload flow, queue handling, usage limits, and result polling.
 *
 * Add new AI-powered tools here, then make sure the matching page component,
 * frontend service, pipeline hook, backend endpoint, and navigation item exist.
 */

import React from 'react';

/**
 * AI-powered image tool routes.
 *
 * @type {{ path: string, component: React.LazyExoticComponent<React.ComponentType> }[]}
 */
const aiFeatureRoutes = [
  {
    path: '/upscale',
    component: React.lazy(() => import('../pages/AiFeatures/UpscaleImage')),
  },
  {
    path: '/remove-bg',
    component: React.lazy(() => import('../pages/AiFeatures/RemoveBackground')),
  },
  {
    path: '/color-restoration',
    component: React.lazy(() => import('../pages/AiFeatures/ColorRestoration')),
  },
  {
    path: '/object-remove',
    component: React.lazy(() => import('../pages/AiFeatures/ObjectRemover')),
  },
];

export default aiFeatureRoutes;