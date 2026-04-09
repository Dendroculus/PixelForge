import React from 'react';

const routes = [
  {
    path: '/',
    component: React.lazy(() => import('./pages/Landing/Home')), 
  },
  {
    path: '/upscale',
    component: React.lazy(() => import('./pages/Upscale/UpscaleImage')), 
  },
  {
    path: '/remove-bg',
    component: React.lazy(() => import('./pages/RemoveBG/RemoveBackground')),
  },
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
  {
    path: '/compress-image',
    component: React.lazy(() =>  import('./pages/Compressor/CompressImage')),
  },
  {
    path: '/convert-format',
    component: React.lazy(() => import('./pages/Formatting/ConvertFormat')),
  },
  {
    path: '/metadata',
    component: React.lazy(() => import('./pages/Metadata/MetadataWorkspace')),
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
  }
];

export default routes;