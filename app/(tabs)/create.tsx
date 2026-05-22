import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function CreateScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-extrabold text-foreground">Geef weg</Text>
      <Text className="text-sm text-muted-foreground mt-2">Komt in taak #12</Text>
    </View>
  );
}
