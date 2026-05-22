import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';

export default function HomeScreen() {
  const { user, loading, signOut } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="bg-card rounded-2xl p-8 w-full max-w-sm gap-3">
        <Text className="text-2xl font-extrabold text-foreground text-center">
          Shared hooks test
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          {loading
            ? '⏳ useAuth aan het laden...'
            : user
              ? `✅ Ingelogd als ${user.email}`
              : '✅ useAuth werkt — geen sessie (Auth-pagina komt nog)'}
        </Text>
        {user ? (
          <Button onPress={() => signOut()} variant="destructive">
            <Text>Uitloggen</Text>
          </Button>
        ) : (
          <Button disabled>
            <Text>Login knop (taak #9)</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
