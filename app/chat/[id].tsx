import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-extrabold text-foreground">Chat Detail</Text>
      <Text className="text-sm text-muted-foreground mt-2">ID: {id}</Text>
      <Text className="text-sm text-muted-foreground">Komt in taak #14</Text>
    </View>
  );
}
