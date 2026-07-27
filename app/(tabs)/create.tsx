import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Loader2, Plus, X } from 'lucide-react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePost, type UploadAsset } from '@/lib/hooks/usePosts';

const categories = [
  'Meubels',
  'Kinderen',
  'Keuken',
  'Elektronica',
  'Boeken',
  'Tuin',
  'Sport',
  'Kleding',
  'Overig',
];

type ImageItem = {
  uri: string;
  asset: UploadAsset;
};

export default function CreateScreen() {
  const router = useRouter();
  const createPost = useCreatePost();

  const [images, setImages] = useState<ImageItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (kind: 'success' | 'error', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const pickImages = async () => {
    const remaining = 5 - images.length;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('error', 'Geef toegang tot je foto\'s om afbeeldingen te kiezen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled) return;

    const newItems: ImageItem[] = result.assets.slice(0, remaining).map((a, i) => ({
      uri: a.uri,
      asset: {
        uri: a.uri,
        name: a.fileName || `image-${Date.now()}-${i}.jpg`,
        mimeType: a.mimeType || 'image/jpeg',
      },
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await createPost.mutateAsync({
        title,
        description,
        category,
        pickup_notes: pickupNotes,
        imageFiles: images.map((img) => img.asset),
      });
      showToast('success', 'Geplaatst! 🎉');
      setTitle('');
      setDescription('');
      setCategory('');
      setPickupNotes('');
      setImages([]);
      setTimeout(() => router.replace('/'), 800);
    } catch (err: any) {
      showToast('error', err?.message || 'Publiceren mislukt');
    }
  };

  const canSubmit =
    title && description && category && images.length > 0 && !createPost.isPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Brand app-header (full-width) */}
      <View style={{ backgroundColor: "#18193f" }} className="pt-4 pb-5">
        <View className="max-w-lg mx-auto w-full px-4">
          <Text className="text-3xl font-heading text-white">Iets weggeven</Text>
          <Text className="text-sm text-white/80 mt-1">
            Droppen is delen, maak een buurtgenoot blij.
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="max-w-lg w-full mx-auto px-4 py-5 gap-6"
        keyboardShouldPersistTaps="handled">
        <View>
          <Text className="text-sm font-poppins-700 text-foreground mb-3">
            Foto&apos;s <Text className="text-muted-foreground font-poppins-400">(max 5)</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {images.map((img, i) => (
                <View key={i} className="w-24 h-24 rounded-2xl overflow-hidden">
                  <Image source={{ uri: img.uri }} className="w-full h-full" />
                  <Pressable
                    onPress={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 items-center justify-center">
                    <X size={14} color="white" />
                  </Pressable>
                </View>
              ))}
              {images.length < 5 && (
                <Pressable
                  onPress={pickImages}
                  className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-primary/40">
                  <LinearGradient
                    colors={['rgba(104,128,255,0.12)', 'rgba(246,95,231,0.12)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {images.length === 0 ? (
                      <>
                        <Camera size={22} color="hsl(231 100% 71%)" />
                        <Text className="text-xs text-primary font-poppins-600">
                          Voeg toe
                        </Text>
                      </>
                    ) : (
                      <Plus size={24} color="hsl(231 100% 71%)" />
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>

        <View>
          <Text className="text-sm font-poppins-700 text-foreground mb-2">Titel</Text>
          <Input
            placeholder="Bijv. IKEA Kallax kast"
            value={title}
            onChangeText={setTitle}
            className="h-12 rounded-full px-5"
          />
        </View>

        <View>
          <Text className="text-sm font-poppins-700 text-foreground mb-2">Beschrijving</Text>
          <Textarea
            placeholder="Vertel iets over het product, de staat en eventuele gebreken..."
            value={description}
            onChangeText={setDescription}
            className="min-h-[100px] rounded-2xl px-4 py-3"
          />
        </View>

        <View>
          <Text className="text-sm font-poppins-700 text-foreground mb-3">Categorie</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => {
              const active = category === cat;
              if (active) {
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className="h-10 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={['#6880FF', '#F65FE7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        flex: 1,
                        paddingHorizontal: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text className="text-sm font-poppins-600 text-white">{cat}</Text>
                    </LinearGradient>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className="px-4 h-10 rounded-full items-center justify-center bg-white border border-border">
                  <Text className="text-sm font-poppins-600 text-foreground">{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="text-sm font-poppins-700 text-foreground mb-2">
            Ophaalvoorkeur{' '}
            <Text className="text-muted-foreground font-poppins-400">(optioneel)</Text>
          </Text>
          <Input
            placeholder="Bijv. voordeur begane grond, na 17:00"
            value={pickupNotes}
            onChangeText={setPickupNotes}
            className="h-12 rounded-full px-5"
          />
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: 'rgba(104,128,255,0.22)',
            borderRadius: 20,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={['rgba(104,128,255,0.14)', 'rgba(246,95,231,0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 16 }}>
            <Text className="text-sm text-foreground leading-relaxed">
              📍 Je product wordt zichtbaar voor buren binnen{' '}
              <Text className="font-poppins-700">7 km</Text>.
              {'\n'}
              ⏱️ Na 24 uur of bij 100 likes wordt automatisch een winnaar geloot.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      <View className="px-4 py-4 bg-background border-t border-border">
        <View className="max-w-lg mx-auto w-full">
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            className={`w-full h-14 rounded-full overflow-hidden ${
              !canSubmit ? 'opacity-50' : ''
            }`}
            style={
              canSubmit
                ? Platform.select({
                    ios: {
                      shadowColor: '#F65FE7',
                      shadowOpacity: 0.45,
                      shadowRadius: 18,
                      shadowOffset: { width: 0, height: 8 },
                    },
                    android: { elevation: 8 },
                    web: { boxShadow: '0 8px 22px rgba(246,95,231,0.45)' } as any,
                  })
                : undefined
            }>
            <LinearGradient
              colors={['#6880FF', '#F65FE7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}>
              {createPost.isPending ? (
                <Loader2 size={20} color="white" />
              ) : (
                <Text className="font-poppins-700 text-base text-white">Publiceer gratis</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {toast && (
        <View
          className="absolute top-16 left-4 right-4 rounded-2xl overflow-hidden"
          style={{
            borderWidth: 1,
            borderColor:
              toast.kind === 'success' ? 'rgba(63,159,82,0.4)' : 'rgba(228,72,72,0.4)',
          }}>
          <LinearGradient
            colors={
              toast.kind === 'success'
                ? ['rgba(159,250,127,0.95)', 'rgba(239,253,233,0.95)']
                : ['rgba(228,72,72,0.14)', 'rgba(246,95,231,0.1)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 12 }}>
            <Text
              className={`text-sm font-poppins-600 ${
                toast.kind === 'success' ? 'text-foreground' : 'text-destructive'
              }`}>
              {toast.msg}
            </Text>
          </LinearGradient>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
