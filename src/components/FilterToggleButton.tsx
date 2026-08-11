import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UI } from '@/src/theme/ui';

type FilterToggleButtonProps = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  onPress: () => void;
};

/**
 * Кнопка фильтра с явной горизонтальной компоновкой иконки и текста.
 * Не использует Paper Button icon — чтобы избежать наложений на Android.
 */
export function FilterToggleButton({
  label,
  icon,
  active,
  onPress,
}: FilterToggleButtonProps) {
  const color = active ? UI.onPrimary : UI.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.button, active ? styles.active : styles.idle]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={color}
          style={styles.icon}
        />
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    height: UI.buttonHeight,
    borderRadius: UI.buttonBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  active: {
    backgroundColor: UI.primary,
  },
  idle: {
    backgroundColor: UI.filterIdle,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  icon: {
    // Без абсолютного позиционирования и отрицательных margin.
  },
  label: {
    fontSize: UI.filterLabelFontSize,
    fontWeight: '500',
    flexShrink: 1,
  },
});
