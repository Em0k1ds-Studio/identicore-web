import type { RouteDefinition } from '@solidjs/router';

import { lazy } from 'solid-js';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: lazy(() => import('./pages/App')),
  },
  {
    path: '**',
    component: lazy(() => import('./errors/404')),
  },
];
