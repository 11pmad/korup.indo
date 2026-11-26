'use client';

import React from 'react';
import App, { AppProps } from '@/legacy-ui/App';

export function V1AppShell(props: AppProps) {
  return <App {...props} />;
}
