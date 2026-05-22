import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="bg-card rounded-2xl p-8 w-full max-w-sm gap-3">
        <Text className="text-3xl font-extrabold text-foreground text-center mb-2">
          Welkom bij <Text className="text-primary">Droppy</Text>
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-4">
          RNR test — als deze knoppen klikbaar zijn werkt react-native-reusables.
        </Text>
        <Button>
          <Text>Default</Text>
        </Button>
        <Button variant="secondary">
          <Text>Secondary</Text>
        </Button>
        <Button variant="outline">
          <Text>Outline</Text>
        </Button>
        <Button variant="destructive">
          <Text>Destructive</Text>
        </Button>
        <Button variant="ghost">
          <Text>Ghost</Text>
        </Button>
      </View>
    </View>
  );
}
