import type { ComponentType } from 'react';
import { Page } from '@/components/Page.tsx';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
}

function PlaceholderPage() {
  return <Page back={false}>tg-app-live: skeleton OK</Page>;
}

export const routes: Route[] = [
  { path: '/', Component: PlaceholderPage },
];
