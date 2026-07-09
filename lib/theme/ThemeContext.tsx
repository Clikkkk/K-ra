import React, { createContext, useContext, useEffect, useState } from 'react';

import { getSetting, setSetting } from '@/lib/db/settings';
import { colors as defaultColors } from './tokens';

export type AccentTheme = 'terracotta' | 'glacier' | 'cyberpunk';
export type ControllerSkin = 'minimalist' | 'retro' | 'translucent';

export const THEME_PRESETS: Record<AccentTheme, { accent: string; accentMuted: string }> = {
  terracotta: {
    accent: '#C9834A',
    accentMuted: '#4D3627',
  },
  glacier: {
    accent: '#4AC998',
    accentMuted: '#1A3B30',
  },
  cyberpunk: {
    accent: '#00E5FF',
    accentMuted: '#003E45',
  },
};

type ThemeColors = Omit<typeof defaultColors, 'accent' | 'accentMuted'> & {
  accent: string;
  accentMuted: string;
};

type ThemeContextType = {
  accentTheme: AccentTheme;
  controllerSkin: ControllerSkin;
  colors: ThemeColors;
  changeAccentTheme: (theme: AccentTheme) => Promise<void>;
  changeControllerSkin: (skin: ControllerSkin) => Promise<void>;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('terracotta');
  const [controllerSkin, setControllerSkin] = useState<ControllerSkin>('minimalist');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const themeVal = (await getSetting('theme_accent', 'terracotta')) as AccentTheme;
      const skinVal = (await getSetting('controller_skin', 'minimalist')) as ControllerSkin;

      setAccentTheme(themeVal);
      setControllerSkin(skinVal);
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function changeAccentTheme(theme: AccentTheme) {
    setAccentTheme(theme);
    await setSetting('theme_accent', theme);
  }

  async function changeControllerSkin(skin: ControllerSkin) {
    setControllerSkin(skin);
    await setSetting('controller_skin', skin);
  }

  // Build colors object with overrides based on the active theme preset
  const activeColors = {
    ...defaultColors,
    ...THEME_PRESETS[accentTheme],
  };

  return (
    <ThemeContext.Provider
      value={{
        accentTheme,
        controllerSkin,
        colors: activeColors,
        changeAccentTheme,
        changeControllerSkin,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
