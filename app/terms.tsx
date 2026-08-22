import { ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';

import { TermsContent } from '@/components/legal/LegalContent';
import { Text } from '@/components/ui/text';

// Publieke pagina (geen login vereist): voorwaarden op een publieke URL
// voor de app stores en voor gebruikers zonder account.
export default function TermsPage() {
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ backgroundColor: '#18193f' }} className="pt-6 pb-5">
        <View className="max-w-lg mx-auto w-full px-4">
          <Text className="text-3xl font-heading text-white">Algemene Voorwaarden</Text>
          <Text className="text-sm text-white/70 mt-1">Droppi, door BP Ecom</Text>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="max-w-lg w-full mx-auto px-4 py-6 gap-4 pb-16">
        <TermsContent />
      </ScrollView>
    </View>
  );
}
