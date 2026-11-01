import 'src/global.css';

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

import { AuthProvider } from 'src/auth';
import { MainLayout } from 'src/layouts';
import { CONFIG } from 'src/global-config';
import { LangProvider } from 'src/locales';
import { primary } from 'src/theme/core/palette';
import { themeConfig, ThemeProvider } from 'src/theme';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { detectSettings } from 'src/components/settings/server';
import { defaultSettings, SettingsProvider } from 'src/components/settings';

// ----------------------------------------------------------------------

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: primary.main,
};

export const metadata = {
  title: 'Trivia-wiki — learn by playing',
  description:
    'A playable trivia encyclopedia: short visual lessons and quizzes on mythology, geography, space and general trivia, with a personal analysis of what to improve.',
  icons: [{ rel: 'icon', url: `${CONFIG.assetsDir}/favicon.ico` }],
};

// ----------------------------------------------------------------------

async function getAppConfig() {
  if (CONFIG.isStaticExport) {
    return { cookieSettings: undefined, dir: defaultSettings.direction };
  }
  const settings = await detectSettings();
  return { cookieSettings: settings, dir: settings.direction };
}

export default async function RootLayout({ children }) {
  const appConfig = await getAppConfig();

  return (
    <html lang="mn" dir={appConfig.dir} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript
          defaultMode={themeConfig.defaultMode}
          modeStorageKey={themeConfig.modeStorageKey}
          attribute={themeConfig.cssVariables.colorSchemeSelector}
        />

        <SettingsProvider
          cookieSettings={appConfig.cookieSettings}
          defaultSettings={defaultSettings}
        >
          <AppRouterCacheProvider options={{ key: 'css' }}>
            <ThemeProvider
              defaultMode={themeConfig.defaultMode}
              modeStorageKey={themeConfig.modeStorageKey}
            >
              <LangProvider>
                <AuthProvider>
                  <MotionLazy>
                    <ProgressBar />
                    <MainLayout>{children}</MainLayout>
                  </MotionLazy>
                </AuthProvider>
              </LangProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
