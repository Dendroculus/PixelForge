import React from 'react';

const routes = [
  {
    path: '/',
    component: React.lazy(() => import('./pages/Hub/HomeHub')), 
  },
  {
    path: '/upscale',
    component: React.lazy(() => import('./pages/Upscale/UpscaleWorkspace')), 
  },
  // {
  //   path: '/remove-bg',
  //   component: React.lazy(() => import('./pages/RemoveBG/RemoveBGWorkspace')),
  // },
  // {
  //   path: '/denoise',
  //   component: React.lazy(() => import('./pages/Denoise/DenoiseWorkspace')),
  // },
  // {
  //   path: '/image-editor',
  //   component: React.lazy(() => import('./pages/ImageEditor/ImageEditorWorkspace')),
  // },
  // {
  //   path: '/resize-image',
  //   component: React.lazy(() => import('./pages/Resize/ResizeWorkspace')),
  // },
  // {
  //   path: '/crop-image',
  //   component: React.lazy(() => import('./pages/Crop/CropWorkspace')),
  // },
  // {
  //   path: '/watermark',
  //   component: React.lazy(() => import('./pages/Watermark/WatermarkWorkspace')),
  // },
  // {
  //   path: '/convert-format',
  //   component: React.lazy(() => import('./pages/Watermark/WatermarkWorkspace')),
  // },
  {
    path: '/metadata',
    component: React.lazy(() => import('./pages/Metadata/MetadataWorkspace')),
  },
  {
    path: '/coming-soon', 
    component: React.lazy(() => import('./pages/Special/ComingSoon')), 
  },
  {
    path: '*', 
    component: React.lazy(() => import('./pages/Special/NotFound')), 
  }
];

export default routes;