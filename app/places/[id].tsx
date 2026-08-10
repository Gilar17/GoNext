import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/src/components/ScreenScaffold';

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title="Место"
      description={`Карточка места (id: ${id}). Будет реализована в Этапе 4.`}
    />
  );
}
