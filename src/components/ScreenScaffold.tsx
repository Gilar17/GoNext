import type { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { UI } from '@/src/theme/ui';

type ScreenScaffoldProps = {
  title: string;
  children?: ReactNode;
  showBack?: boolean;
  titleIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Действия сразу после заголовка (не у правого края). */
  titleTrailing?: ReactNode;
  actions?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenScaffold({
  title,
  children,
  showBack = true,
  titleIcon,
  titleTrailing,
  actions,
  contentStyle,
}: ScreenScaffoldProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const iconColor = theme.colors.onSurface;
  const titleColor = theme.colors.onSurface;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header} dark={theme.dark}>
        {showBack ? (
          <Appbar.BackAction
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
            color={iconColor}
          />
        ) : null}
        {titleTrailing ? (
          <>
            <Text
              variant="titleLarge"
              style={[styles.inlineTitle, { color: titleColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <View style={styles.headerSpacer} />
            {actions}
            <View style={styles.headerOverlay} pointerEvents="box-none">
              {titleTrailing}
            </View>
          </>
        ) : (
          <>
            <Appbar.Content
              title={title}
              titleStyle={[styles.title, { color: titleColor }]}
              color={titleColor}
              style={styles.titleContent}
            />
            {titleIcon ? (
              <View
                style={styles.headerTrailingIcon}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialCommunityIcons
                  name={titleIcon}
                  size={UI.headerIconSize}
                  color={iconColor}
                />
              </View>
            ) : null}
            {actions}
          </>
        )}
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
  description,
}: PlaceholderScreenProps) {
  const { t } = useTranslation();
  return (
    <ScreenScaffold title={title}>
      <Text variant="bodyLarge" style={styles.placeholder}>
        {description ?? t('scaffold.placeholder')}
      </Text>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'relative',
    overflow: 'visible',
  },
  content: {
    flex: 1,
    padding: 24,
    backgroundColor: 'transparent',
  },
  titleContent: {
    marginLeft: 0,
    marginRight: 0,
  },
  title: {
    marginLeft: 0,
  },
  headerTrailingIcon: {
    marginLeft: UI.headerTitleIconGap,
    marginRight: 8,
    width: UI.headerIconSize,
    height: UI.headerIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineTitle: {
    marginLeft: 0,
    marginRight: 4,
    alignSelf: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
  placeholder: {
    textAlign: 'center',
    marginTop: 24,
  },
});
