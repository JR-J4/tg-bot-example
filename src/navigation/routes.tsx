import type { ComponentType } from 'react';

import { EchoPage } from '@/pages/EchoPage.tsx';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
}

export const routes: Route[] = [
  { path: '/', Component: EchoPage },
];
