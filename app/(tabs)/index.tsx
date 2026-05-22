import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="bg-card rounded-2xl p-8 w-full max-w-sm">
        <Text className="text-3xl font-extrabold text-foreground text-center mb-2">
          Welkom bij <Text className="text-primary">Droppy</Text>
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-6">
          NativeWind test — als je dit met kleuren ziet werkt Tailwind op React Native.
        </Text>
        <View className="bg-primary rounded-xl py-4 px-6">
          <Text className="text-primary-foreground text-center font-bold">
            Primary button (blauw)
          </Text>
        </View>
        <View className="bg-accent rounded-xl py-4 px-6 mt-3">
          <Text className="text-accent-foreground text-center font-bold">
            Accent button (groen)
          </Text>
        </View>
      </View>
    </View>
  );
}
