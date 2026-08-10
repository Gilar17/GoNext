import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

type ScreenScaffoldProps = {
  title: string;
  children?: ReactNode;
  showBack?: boolean;
};

export function ScreenScaffold({
  title,
  children,
  showBack = true,
}: ScreenScaffoldProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        {showBack ? <Appbar.BackAction onPress={() => router.back()} /> : null}
        <Appbar.Content title={title} />
      </Appbar.Header>
      <View style={styles.content}>{children}</View>
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
  },
  content: {
    flex: 1,
    padding: 24,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: 24,
  },
});
