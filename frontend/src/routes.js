/**
 * Root route facade for the PixelForge frontend.
 *
 * This file keeps App.jsx simple by exporting one combined route registry,
 * while the actual route definitions are split into category-specific files
 * inside `src/routes/`.
 *
 * Route category files:
 * - landing.routes.js: landing/home routes
 * - aiFeature.routes.js: AI-powered image tools
 * - smartEdit.routes.js: browser-based editing tools
 * - optimize.routes.js: compression, conversion, and metadata tools
 * - utility.routes.js: supporting utility tools
 * - special.routes.js: fallback and special-purpose pages
 */

import landingRoutes from './routes/landing.routes';
import aiFeatureRoutes from './routes/aiFeature.routes';
import smartEditRoutes from './routes/smartEdit.routes';
import optimizeRoutes from './routes/optimize.routes';
import utilityRoutes from './routes/utility.routes';
import specialRoutes from './routes/special.routes';

/**
 * Combined application route registry consumed by App.jsx.
 *
 * Keep this file as the only public route import for the app shell.
 * Add new routes inside the matching category file, then expose them here
 * through the spread merge below.
 *
 * @type {{ path: string, component: import('react').LazyExoticComponent<import('react').ComponentType> }[]}
 */
const routes = [
  ...landingRoutes,
  ...aiFeatureRoutes,
  ...smartEditRoutes,
  ...optimizeRoutes,
  ...utilityRoutes,
  ...specialRoutes,
];

export default routes;