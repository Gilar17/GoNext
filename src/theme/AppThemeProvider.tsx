import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';
import { UI } from '@/src/theme/ui';
import {
  DEFAULT_PRIMARY,
  isPrimaryColor,
} from '@/src/theme/primaryColors';
import {
  getSurfaceColors,
  type ColorSchemeName,
  type SurfaceColors,
} from '@/src/theme/surfaces';

type AppearanceSettings = {
  colorScheme: ColorSchemeName;
  primary: string;
};

type AppThemeContextValue = {
  ready: boolean;
  colorScheme: ColorSchemeName;
  setColorScheme: (scheme: ColorSchemeName) => void;
  primary: string;
  setPrimary: (color: string) => void;
  paperTheme: MD3Theme;
  surfaces: SurfaceColors;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function getSettingsPath(): string | null {
  const base = FileSystem.documentDirectory;
  if (!base) {
    return null;
  }
  return `${base}appearance.json`;
}

function getPaperTheme(scheme: ColorSchemeName, primary: string): MD3Theme {
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary,
      onPrimary: UI.onPrimary,
    },
  };
}

async function loadAppearance(): Promise<AppearanceSettings> {
  const path = getSettingsPath();
  if (!path) {
    return { colorScheme: 'light', primary: DEFAULT_PRIMARY };
  }
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      return { colorScheme: 'light', primary: DEFAULT_PRIMARY };
    }
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw) as {
      colorScheme?: string;
      primary?: string;
    };
    return {
      colorScheme: parsed.colorScheme === 'dark' ? 'dark' : 'light',
      primary:
        typeof parsed.primary === 'string' && isPrimaryColor(parsed.primary)
          ? parsed.primary
          : DEFAULT_PRIMARY,
    };
  } catch {
    return { colorScheme: 'light', primary: DEFAULT_PRIMARY };
  }
}

async function saveAppearance(settings: AppearanceSettings): Promise<void> {
  const path = getSettingsPath();
  if (!path) {
    return;
  }
  await FileSystem.writeAsStringAsync(path, JSON.stringify(settings));
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [colorScheme, setColorSchemeState] =
    useState<ColorSchemeName>('light');
  const [primary, setPrimaryState] = useState(DEFAULT_PRIMARY);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadAppearance();
      if (!cancelled) {
        setColorSchemeState(saved.colorScheme);
        setPrimaryState(saved.primary);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    void saveAppearance({ colorScheme, primary });
  }, [ready, colorScheme, primary]);

  const setColorScheme = useCallback((scheme: ColorSchemeName) => {
    setColorSchemeState(scheme);
  }, []);

  const setPrimary = useCallback((color: string) => {
    if (isPrimaryColor(color)) {
      setPrimaryState(color);
    }
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      ready,
      colorScheme,
      setColorScheme,
      primary,
      setPrimary,
      paperTheme: getPaperTheme(colorScheme, primary),
      surfaces: getSurfaceColors(colorScheme, primary),
    }),
    [ready, colorScheme, setColorScheme, primary, setPrimary],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const value = useContext(AppThemeContext);
  if (!value) {
    throw new Error('useAppTheme должен использоваться внутри AppThemeProvider');
  }
  return value;
}
