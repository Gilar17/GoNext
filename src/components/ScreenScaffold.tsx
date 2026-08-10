import type { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

type ScreenScaffoldProps = {
  title: string;
  children?: ReactNode;
  showBack?: boolean;
  actions?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenScaffold({
  title,
  children,
  showBack = true,
  actions,
  contentStyle,
}: ScreenScaffoldProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        {showBack ? <Appbar.BackAction onPress={() => router.back()} /> : null}
        <Appbar.Content title={title} />
        {actions}
      </Appbar.Header>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

type PlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function PlaceholderScreen({
  title,
  description = 'Экран будет реализован на следующих этапах.',
}: PlaceholderScreenProps) {
  return (
    <ScreenScaffold title={title}>
      <Text variant="bodyLarge" style={styles.placeholder}>
        {description}
      </Text>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 24,
    backgroundColor: 'transparent',
  },
  placeholder: {
    textAlign: 'center',
    marginTop: 24,
  },
});
