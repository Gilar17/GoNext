/**
 * Единые стили кнопок экрана «Поездка».
 * Источник размеров — UI-константы GoNext.
 */
import { UI } from '@/src/theme/ui';
import { useAppTheme } from '@/src/theme/AppThemeProvider';

export function useAccentStyles() {
  const { primary } = useAppTheme();
  return {
    primary,
    outline: { borderColor: primary },
    filled: { borderColor: primary, backgroundColor: primary },
    label: { color: primary },
  };
}

export const TRIP_BUTTON = {
  height: UI.buttonHeight,
  fontSize: UI.buttonFontSize,
  fontWeight: '500' as const,
  borderRadius: UI.buttonBorderRadius,
  borderWidth: 1.5,
  iconSize: 18,
  gap: 8,
} as const;

export const tripButtonStyle = {
  borderRadius: TRIP_BUTTON.borderRadius,
  margin: 0,
} as const;

export const tripOutlineButtonStyle = {
  ...tripButtonStyle,
  borderColor: UI.primary,
  borderWidth: TRIP_BUTTON.borderWidth,
  backgroundColor: 'transparent' as const,
};

export const tripFilledButtonStyle = {
  ...tripButtonStyle,
  borderColor: UI.primary,
  borderWidth: TRIP_BUTTON.borderWidth,
  backgroundColor: UI.primary,
};

export const tripButtonContentStyle = {
  height: TRIP_BUTTON.height,
  justifyContent: 'center' as const,
};

export const tripButtonLabelStyle = {
  fontSize: TRIP_BUTTON.fontSize,
  fontWeight: TRIP_BUTTON.fontWeight,
  marginVertical: 0,
  marginHorizontal: 16,
};

/**
 * Paper MD3 задаёт контейнеру иконки marginLeft: 16 и marginRight: -16.
 * Левый margin 24 у label компенсирует это и оставляет 8 px между
 * видимой иконкой и текстом; симметричный внешний отступ 16 сохраняет
 * центрирование всей группы.
 */
export const tripButtonIconLabelStyle = {
  ...tripButtonLabelStyle,
  marginLeft: 24,
  marginRight: 16,
};

export const tripOutlineLabelStyle = {
  ...tripButtonLabelStyle,
  color: UI.primary,
};

export const tripOutlineIconLabelStyle = {
  ...tripButtonIconLabelStyle,
  color: UI.primary,
};

export const tripFilledLabelStyle = {
  ...tripButtonLabelStyle,
  color: UI.onPrimary,
};

export const tripFilledIconLabelStyle = {
  ...tripButtonIconLabelStyle,
  color: UI.onPrimary,
};

export const tripButtonTheme = {
  roundness: TRIP_BUTTON.borderRadius,
} as const;
