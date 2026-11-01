'use client';

import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import { useLang } from 'src/locales';
import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise = null;

const loadScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.onload = resolve;
    el.onerror = () => {
      scriptPromise = null;
      reject(new Error('Google script failed to load'));
    };
    document.head.appendChild(el);
  });
  return scriptPromise;
};

/**
 * Google Identity Services "Sign in with Google" button. Google renders it in
 * an iframe and hands back an ID token, which the API verifies.
 */
export function GoogleButton({ onCredential, onError }) {
  const { lang, s } = useLang();
  const box = useRef(null);
  const [failed, setFailed] = useState(false);
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    if (!CONFIG.googleClientId) return undefined;
    let alive = true;
    loadScript()
      .then(() => {
        if (!alive || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: CONFIG.googleClientId,
          callback: (res) => callback.current(res.credential),
          ux_mode: 'popup',
        });
        box.current.innerHTML = '';
        window.google.accounts.id.renderButton(box.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: lang,
          width: Math.min(box.current.clientWidth || 360, 400),
        });
      })
      .catch((err) => {
        setFailed(true);
        onError?.(err);
      });
    return () => {
      alive = false;
    };
  }, [lang, onError]);

  if (!CONFIG.googleClientId || failed) {
    return (
      <Tooltip title={s.googleNotConfigured}>
        <span>
          <Button
            fullWidth
            disabled
            size="large"
            variant="outlined"
            startIcon={<Iconify icon="logos:google-icon" />}
          >
            {s.continueWithGoogle}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Box ref={box} sx={{ width: 1, minHeight: 44, display: 'flex', justifyContent: 'center' }} />
  );
}
