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
import { Camera, Loader2, Plus, X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-5 gap-6"
        keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-extrabold text-foreground">Iets weggeven</Text>

        <View>
          <Text className="text-sm font-bold text-foreground mb-3">
            Foto&apos;s <Text className="text-muted-foreground font-normal">(max 5)</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {images.map((img, i) => (
                <View key={i} className="w-24 h-24 rounded-xl overflow-hidden">
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
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border items-center justify-center gap-1">
                  {images.length === 0 ? (
                    <>
                      <Camera size={24} color="hsl(213 20% 46%)" />
                      <Text className="text-xs text-muted-foreground font-semibold">
                        Voeg toe
                      </Text>
                    </>
                  ) : (
                    <Plus size={24} color="hsl(213 20% 46%)" />
                  )}
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>

        <View>
          <Text className="text-sm font-bold text-foreground mb-2">Titel</Text>
          <Input
            placeholder="Bijv. IKEA Kallax kast"
            value={title}
            onChangeText={setTitle}
            className="h-12 rounded-xl"
          />
        </View>

        <View>
          <Text className="text-sm font-bold text-foreground mb-2">Beschrijving</Text>
          <Textarea
            placeholder="Vertel iets over het product, de staat en eventuele gebreken..."
            value={description}
            onChangeText={setDescription}
            className="min-h-[100px] rounded-xl"
          />
        </View>

        <View>
          <Text className="text-sm font-bold text-foreground mb-3">Categorie</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl ${
                    active ? 'bg-primary' : 'bg-card border border-border'
                  }`}>
                  <Text
                    className={`text-sm font-semibold ${
                      active ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="text-sm font-bold text-foreground mb-2">
            Ophaalvoorkeur{' '}
            <Text className="text-muted-foreground font-normal">(optioneel)</Text>
          </Text>
          <Input
            placeholder="Bijv. voordeur begane grond, na 17:00"
            value={pickupNotes}
            onChangeText={setPickupNotes}
            className="h-12 rounded-xl"
          />
        </View>

        <View className="p-4 rounded-xl bg-primary/5">
          <Text className="text-sm text-foreground leading-relaxed">
            📍 Je product wordt zichtbaar voor buren binnen <Text className="font-bold">7 km</Text>.
            {'\n'}
            ⏱️ Na 24 uur of bij 100 likes wordt automatisch een winnaar geloot.
          </Text>
        </View>
      </ScrollView>

      <View className="px-4 py-4 bg-background border-t border-border">
        <Button
          onPress={handleSubmit}
          size="lg"
          className="w-full h-14 rounded-xl"
          disabled={!canSubmit}>
          {createPost.isPending ? (
            <Loader2 size={20} color="white" />
          ) : (
            <Text className="font-bold">Publiceer gratis</Text>
          )}
        </Button>
      </View>

      {toast && (
        <View
          className={`absolute top-16 left-4 right-4 p-3 rounded-xl ${
            toast.kind === 'success'
              ? 'bg-droppy-success/10 border border-droppy-success'
              : 'bg-destructive/10 border border-destructive'
          }`}>
          <Text
            className={`text-sm ${
              toast.kind === 'success' ? 'text-droppy-success' : 'text-destructive'
            }`}>
            {toast.msg}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
