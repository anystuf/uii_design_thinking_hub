'use client';

import { useEffect } from 'react';

/**
 * Supabase sends failed confirmation/recovery links back to the configured
 * Site URL with an error fragment. Do not display the public homepage as
 * though authentication succeeded. Never forward token or error fragments.
 */
export function AuthRecoveryErrorForwarder() {
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (fragment.get('error') !== 'access_denied') return;
    if (fragment.get('error_code') !== 'otp_expired') return;
    window.location.replace('/forgot-password?reason=expired');
  }, []);
  return null;
}
