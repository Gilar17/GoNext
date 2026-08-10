import { useLocalSearchParams } from 'expo-router';
import { PlaceholderScreen } from '@/src/components/ScreenScaffold';

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceholderScreen
      title="Поездка"
      description={`Детали поездки и маршрут (id: ${id}). Будут реализованы в Этапе 5.`}
    />
  );
}
