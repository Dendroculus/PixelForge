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
  {
    path: '*', 
    component: React.lazy(() => import('./pages/Special/ComingSoon')), 
  }
];

export default routes;