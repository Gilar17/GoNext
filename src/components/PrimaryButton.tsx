import type { ComponentProps, ReactNode } from 'react';
import { Button } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import {
  primaryButtonContentStyle,
  primaryButtonLabelStyle,
  primaryButtonStyle,
  UI,
} from '@/src/theme/ui';

type PaperButtonProps = ComponentProps<typeof Button>;

type PrimaryButtonProps = Omit<PaperButtonProps, 'mode' | 'children'> & {
  children: ReactNode;
  /**
   * Для фильтров:
   * true — активный (фиолетовый + белый текст),
   * false — неактивный (сиреневый + фиолетовый текст),
   * undefined — обычная основная кнопка.
   */
  active?: boolean;
};

/** Основная фиолетовая кнопка в стиле главного экрана GoNext. */
export function PrimaryButton({
  children,
  active,
  style,
  contentStyle,
  labelStyle,
  buttonColor,
  textColor,
  ...rest
}: PrimaryButtonProps) {
  const { primary, surfaces } = useAppTheme();
  const resolvedButtonColor =
    buttonColor ??
    (active === false ? surfaces.filterIdle : primary);
  const resolvedTextColor =
    textColor ?? (active === false ? surfaces.filterIdleText : UI.onPrimary);

  return (
    <Button
      mode="contained"
      buttonColor={resolvedButtonColor}
      textColor={resolvedTextColor}
      style={[primaryButtonStyle, style]}
      contentStyle={[primaryButtonContentStyle, contentStyle]}
      labelStyle={[
        primaryButtonLabelStyle,
        { color: resolvedTextColor },
        labelStyle,
      ]}
      {...rest}
    >
      {children}
    </Button>
  );
}
