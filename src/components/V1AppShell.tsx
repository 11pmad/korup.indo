'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App, { AppProps } from '@/legacy-ui/App';

export function V1AppShell(props: AppProps) {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    'disabled-until-configured.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <App {...props} />
    </GoogleOAuthProvider>
  );
}
