'use client';

import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    'disabled-until-configured.apps.googleusercontent.com';

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
