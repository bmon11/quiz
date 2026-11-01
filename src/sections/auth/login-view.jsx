'use client';

import { m } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { useLang } from 'src/locales';
import { useAuth, GoogleButton } from 'src/auth';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PERKS = [
  { icon: 'solar:diskette-bold-duotone', en: 'Every result saved', mn: 'Дүн бүр хадгалагдана' },
  {
    icon: 'solar:target-bold-duotone',
    en: 'Your weak spots, by lesson',
    mn: 'Сул талаа хичээл бүрээр харна',
  },
  {
    icon: 'solar:refresh-circle-bold-duotone',
    en: 'Review the questions you missed',
    mn: 'Алдсан асуултаа давтана',
  },
];

export function LoginView({ next, initialMode }) {
  const { s, lang } = useLang();
  const router = useRouter();
  const { user, login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'register') await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
    } catch (err) {
      setError(err?.message || s.loadError);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = useCallback(
    async (credential) => {
      setError('');
      try {
        await loginWithGoogle(credential);
      } catch (err) {
        setError(err?.message || s.loadError);
      }
    },
    [loginWithGoogle, s.loadError]
  );

  const isRegister = mode === 'register';

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 4, md: 8 },
        alignItems: 'center',
        gridTemplateColumns: { xs: '1fr', md: '1fr 440px' },
        minHeight: { md: 'calc(100vh - 220px)' },
      }}
    >
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Trivia
          <Box component="span" sx={{ color: 'primary.main' }}>
            -wiki
          </Box>
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 400, mb: 4, maxWidth: 460 }}
        >
          {s.signInSubtitle}
        </Typography>
        <Stack spacing={2}>
          {PERKS.map((perk, i) => (
            <Stack
              key={perk.icon}
              component={m.div}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'primary.main',
                  bgcolor: 'rgba(var(--palette-primary-mainChannel) / 0.12)',
                }}
              >
                <Iconify icon={perk.icon} width={28} />
              </Box>
              <Typography variant="subtitle1">{perk[lang]}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Card
        component="form"
        onSubmit={submit}
        sx={{ p: { xs: 3, sm: 4 }, width: 1, maxWidth: 440, mx: 'auto' }}
      >
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {isRegister ? s.signUpTitle : s.signInTitle}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isRegister ? s.haveAccount : s.noAccount}{' '}
          <Link
            component="button"
            type="button"
            variant="subtitle2"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register');
              setError('');
            }}
          >
            {isRegister ? s.signIn : s.signUp}
          </Link>
        </Typography>

        <GoogleButton onCredential={onGoogle} />

        <Divider sx={{ my: 3, typography: 'overline', color: 'text.disabled' }}>{s.or}</Divider>

        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          {isRegister && (
            <TextField label={s.name} autoComplete="name" required {...field('name')} />
          )}
          <TextField
            label={s.email}
            type="email"
            autoComplete="email"
            required
            {...field('email')}
          />
          <TextField
            label={s.password}
            type={show ? 'text' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
            helperText={isRegister ? s.passwordHint : undefined}
            slotProps={{
              htmlInput: { minLength: isRegister ? 8 : 1 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShow((v) => !v)}
                      edge="end"
                      aria-label={s.password}
                    >
                      <Iconify icon={show ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...field('password')}
          />
          <LoadingButton type="submit" size="large" variant="contained" loading={busy}>
            {isRegister ? s.signUp : s.signIn}
          </LoadingButton>
        </Stack>
      </Card>
    </Box>
  );
}
