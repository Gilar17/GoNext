/**
 * Единый визуальный стиль основных кнопок GoNext.
 * Эталон — contained-кнопки главного экрана (Paper primary + borderRadius 4).
 */
export const UI = {
  /** Основной фиолетовый (MD3 Paper primary) */
  primary: '#6750A4',
  /** Активный фильтр — тот же основной фиолетовый */
  primaryActive: '#6750A4',
  /** Неактивный фильтр — светлый сиреневый */
  filterIdle: '#E8DEF8',
  onPrimary: '#FFFFFF',
  mutedText: '#666666',
  buttonHeight: 40,
  buttonBorderRadius: 4,
  buttonFontSize: 14,
  filterLabelFontSize: 12,
  buttonGap: 12,
  filterGap: 8,
  iconTextGap: 12,
  /** Минимальный зазор между заголовком Appbar и правой иконкой. */
  headerTitleIconGap: 24,
  headerIconSize: 22,
} as const;

export const primaryButtonStyle = {
  borderRadius: UI.buttonBorderRadius,
} as const;

export const primaryButtonContentStyle = {
  height: UI.buttonHeight,
  justifyContent: 'center' as const,
};

export const primaryButtonLabelStyle = {
  fontSize: UI.buttonFontSize,
  marginVertical: 0,
  color: UI.onPrimary,
};
