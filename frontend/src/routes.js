/**
 * Lazy route registry for the PixelForge frontend.
 *
 * Each entry maps a URL path to a lazily imported page component. Keeping route
 * definitions in this file lets the root app render routes generically while
 * preserving code-splitting for large tool pages.
 */

import React from 'react';

/**
 * Application route definitions consumed by App.jsx.
 *
 * @type {{ path: string, component: React.LazyExoticComponent<React.ComponentType> }[]}
 */
const routes = [
  {
    path: '/',
    component: React.lazy(() => import('./pages/Landing/Home')),
  },
  {
    path: '/upscale',
    component: React.lazy(() => import('./pages/AiFeatures/UpscaleImage')),
  },
  {
    path: '/remove-bg',
    component: React.lazy(() => import('./pages/AiFeatures/RemoveBackground')),
  },
  {
    path: '/color-restoration',
    component: React.lazy(() => import('./pages/AiFeatures/ColorRestoration')),
  },
  {
    path: '/object-remove',
    component: React.lazy(() => import('./pages/AiFeatures/ObjectRemover')),
  },
  {
    path: '/image-editor',
    component: React.lazy(() => import('./pages/SmartEdit/ImageEditor')),
  },
  {
    path: '/resize-image',
    component: React.lazy(() => import('./pages/SmartEdit/ResizeImage')),
  },
  {
    path: '/crop-image',
    component: React.lazy(() => import('./pages/SmartEdit/CropImage')),
  },
  {
    path: '/rotate-flip',
    component: React.lazy(() => import('./pages/SmartEdit/RotateFlip')),
  },
  {
    path: '/watermark-adder',
    component: React.lazy(() => import('./pages/Utilities/WatermarkAdder')),
  },
  {
    path: '/compress-image',
    component: React.lazy(() => import('./pages/Optimize/CompressImage')),
  },
  {
    path: '/convert-format',
    component: React.lazy(() => import('./pages/Optimize/ConvertFormat')),
  },
  {
    path: '/metadata',
    component: React.lazy(() => import('./pages/Optimize/MetadataWorkspace')),
  },
  {
    path: '/color-palette',
    component: React.lazy(() => import('./pages/Utilities/ColorPalette')),
  },
  {
    path: '/coming-soon',
    component: React.lazy(() => import('./pages/Special/ComingSoon')),
  },
  {
    path: '*',
    component: React.lazy(() => import('./pages/Special/NotFound')),
  },
];

export default routes;
