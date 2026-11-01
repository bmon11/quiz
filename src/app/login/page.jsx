import { LoginView } from 'src/sections/auth/login-view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Sign in — Trivia-wiki' };

export default async function Page({ searchParams }) {
  const { next, mode } = await searchParams;
  // Only same-site paths, so ?next= can't send people elsewhere.
  const safeNext =
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/me';
  return <LoginView next={safeNext} initialMode={mode === 'register' ? 'register' : 'login'} />;
}
