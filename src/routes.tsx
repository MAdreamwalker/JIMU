export type Route = {
  path: string;
  title: string;
  pattern: RegExp;
};

export const routes: readonly Route[] = [
  { path: '/', title: 'Projects', pattern: /^\/$/ },
  {
    path: '/project/:projectId/canvas',
    title: 'Canvas',
    pattern: /^\/project\/([^/]+)\/canvas$/,
  },
  {
    path: '/project/:projectId/storyboard',
    title: 'Storyboard',
    pattern: /^\/project\/([^/]+)\/storyboard$/,
  },
  {
    path: '/project/:projectId/director',
    title: 'Director',
    pattern: /^\/project\/([^/]+)\/director$/,
  },
  {
    path: '/project/:projectId/timeline',
    title: 'Timeline',
    pattern: /^\/project\/([^/]+)\/timeline$/,
  },
  { path: '/tasks', title: 'Tasks', pattern: /^\/tasks$/ },
  { path: '/settings', title: 'Settings', pattern: /^\/settings$/ },
];

export function getHashPath(hash: string): string {
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  return path || '/';
}

export function matchRoute(path: string): Route {
  return routes.find((route) => route.pattern.test(path)) ?? routes[0];
}
