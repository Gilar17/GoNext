import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';
import {
  DEFAULT_PRIMARY,
  getOnColor,
  isPrimaryColor,
} from '@/src/theme/primaryColors';
import {
  getSurfaceColors,
  getAccentColor,
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
  /** Контрастный акцент для текста и иконок на фоне темы. */
  accent: string;
  showBackgroundImage: boolean;
  setShowBackgroundImage: (value: boolean) => void;
  paperTheme: MD3Theme;
  surfaces: SurfaceColors;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const SHOW_BACKGROUND_IMAGE_KEY = '@gonext/showBackgroundImage';
const DEFAULT_SHOW_BACKGROUND_IMAGE = true;

function getSettingsPath(): string | null {
  const base = FileSystem.documentDirectory;
  if (!base) {
    return null;
  }
  return `${base}appearance.json`;
}

function getPaperTheme(
  scheme: ColorSchemeName,
  primary: string,
  accent: string,
): MD3Theme {
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: accent,
      onPrimary: getOnColor(accent),
      primaryContainer: primary,
      onPrimaryContainer: getOnColor(primary),
      onSurface: scheme === 'dark' ? '#E6E1E5' : base.colors.onSurface,
      onSurfaceVariant: scheme === 'dark' ? '#B0AAB8' : base.colors.onSurfaceVariant,
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

async function loadShowBackgroundImage(): Promise<boolean> {
  try {
    const saved = await AsyncStorage.getItem(SHOW_BACKGROUND_IMAGE_KEY);
    if (saved === null) {
      return DEFAULT_SHOW_BACKGROUND_IMAGE;
    }
    return saved !== 'false';
  } catch {
    return DEFAULT_SHOW_BACKGROUND_IMAGE;
  }
}

async function saveShowBackgroundImage(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(
      SHOW_BACKGROUND_IMAGE_KEY,
      value ? 'true' : 'false',
    );
  } catch {
    // Выбор уже применён в памяти.
  }
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [colorScheme, setColorSchemeState] =
    useState<ColorSchemeName>('light');
  const [primary, setPrimaryState] = useState(DEFAULT_PRIMARY);
  const [showBackgroundImage, setShowBackgroundImageState] = useState(
    DEFAULT_SHOW_BACKGROUND_IMAGE,
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [saved, savedShowBackground] = await Promise.all([
        loadAppearance(),
        loadShowBackgroundImage(),
      ]);
      if (!cancelled) {
        setColorSchemeState(saved.colorScheme);
        setPrimaryState(saved.primary);
        setShowBackgroundImageState(savedShowBackground);
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

  useEffect(() => {
    if (!ready) {
      return;
    }
    void saveShowBackgroundImage(showBackgroundImage);
  }, [ready, showBackgroundImage]);

  const setColorScheme = useCallback((scheme: ColorSchemeName) => {
    setColorSchemeState(scheme);
  }, []);

  const setPrimary = useCallback((color: string) => {
    if (isPrimaryColor(color)) {
      setPrimaryState(color);
    }
  }, []);

  const setShowBackgroundImage = useCallback((value: boolean) => {
    setShowBackgroundImageState(value);
  }, []);

  const accent = getAccentColor(colorScheme, primary);
  const value = useMemo<AppThemeContextValue>(
    () => ({
      ready,
      colorScheme,
      setColorScheme,
      primary,
      setPrimary,
      accent,
      showBackgroundImage,
      setShowBackgroundImage,
      paperTheme: getPaperTheme(colorScheme, primary, accent),
      surfaces: getSurfaceColors(colorScheme, primary, accent),
    }),
    [
      ready,
      colorScheme,
      setColorScheme,
      primary,
      setPrimary,
      accent,
      showBackgroundImage,
      setShowBackgroundImage,
    ],
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
