import type { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Appbar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

type ScreenScaffoldProps = {
  title: string;
  children?: ReactNode;
  showBack?: boolean;
  titleIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actions?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenScaffold({
  title,
  children,
  showBack = true,
  titleIcon,
  actions,
  contentStyle,
}: ScreenScaffoldProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        {showBack ? (
          <Appbar.BackAction onPress={() => router.back()} />
        ) : null}
        {titleIcon ? (
          <MaterialCommunityIcons
            name={titleIcon}
            size={22}
            color="#fff"
            style={styles.titleIcon}
          />
        ) : null}
        <Appbar.Content title={title} titleStyle={styles.title} />
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
  titleIcon: {
    marginLeft: 4,
    marginRight: 0,
    alignSelf: 'center',
  },
  title: {
    marginLeft: 0,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: 24,
  },
});
