import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';

export default function FeedScreen() {
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="bg-card rounded-2xl p-8 w-full max-w-sm gap-3">
        <Text className="text-2xl font-extrabold text-foreground text-center">Feed</Text>
        <Text className="text-sm text-muted-foreground text-center">
          Ingelogd als {user?.email}. Komt in taak #10.
        </Text>
        <Button onPress={() => signOut()} variant="destructive">
          <Text>Uitloggen</Text>
        </Button>
      </View>
    </View>
  );
}
