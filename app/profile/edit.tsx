import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Home, Loader2, MapPin } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

type AvatarPick = {
  uri: string;
  name: string;
  mimeType: string;
} | null;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarPick, setAvatarPick] = useState<AvatarPick>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || '');
    setLastName(profile.last_name || '');
    setPostcode(profile.postcode || '');
    setHouseNumber(profile.house_number || '');
    setAvatarPreview(profile.avatar_url);
  }, [profile]);

  const showToast = (kind: 'success' | 'error', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('error', "Geef toegang tot je foto's om een avatar te kiezen.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAvatarPick({
      uri: asset.uri,
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    });
    setAvatarPreview(asset.uri);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd');
      let avatarUrl = profile?.avatar_url || null;

      if (avatarPick) {
        const ext = avatarPick.name.includes('.')
          ? avatarPick.name.split('.').pop()
          : 'jpg';
        const path = `${user.id}/avatar.${ext}`;
        const res = await fetch(avatarPick.uri);
        const body = await res.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(path, body, {
            contentType: avatarPick.mimeType,
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(path);
        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      const cleanPostcode = postcode.toUpperCase().replace(/\s/g, '');
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          postcode: cleanPostcode,
          house_number: houseNumber,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);
      if (error) throw error;

      if (
        cleanPostcode !== (profile?.postcode || '') ||
        houseNumber !== (profile?.house_number || '')
      ) {
        try {
          await supabase.functions.invoke('geocode-address', {
            body: { postcode: cleanPostcode, house_number: houseNumber },
          });
        } catch (e) {
          console.warn('Geocoding failed', e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      showToast('success', 'Profiel bijgewerkt!');
      setTimeout(() => router.replace('/profile'), 600);
    },
    onError: (e: any) => showToast('error', e?.message || 'Opslaan mislukt'),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Loader2 size={32} color="hsl(207 90% 54%)" />
      </View>
    );
  }

  const initials = firstName ? `${firstName.charAt(0)}${lastName.charAt(0)}` : '?';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4 py-3 flex-row items-center gap-3 border-b border-border bg-background">
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="hsl(213 79% 13%)" />
        </Pressable>
        <Text className="text-lg font-extrabold text-foreground">Profiel bewerken</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled">
        <View className="max-w-lg mx-auto w-full px-4 py-6 gap-6">
          <View className="items-center gap-3">
            <Pressable
              onPress={pickAvatar}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-primary/10 items-center justify-center">
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} className="w-full h-full" />
              ) : (
                <Text className="text-primary font-extrabold text-3xl">{initials}</Text>
              )}
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center">
                <Camera size={16} color="white" />
              </View>
            </Pressable>
            <Pressable onPress={pickAvatar}>
              <Text className="text-sm text-primary font-semibold">Foto wijzigen</Text>
            </Pressable>
          </View>

          <View className="gap-4">
            <View>
              <Text className="text-sm font-bold text-foreground mb-1.5">Voornaam</Text>
              <Input
                value={firstName}
                onChangeText={setFirstName}
                className="h-14 rounded-xl"
              />
            </View>
            <View>
              <Text className="text-sm font-bold text-foreground mb-1.5">Achternaam</Text>
              <Input
                value={lastName}
                onChangeText={setLastName}
                className="h-14 rounded-xl"
              />
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground mb-1.5">Postcode</Text>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <MapPin size={20} color="hsl(213 20% 46%)" />
                  </View>
                  <Input
                    value={postcode}
                    onChangeText={setPostcode}
                    autoCapitalize="characters"
                    maxLength={7}
                    className="pl-12 h-14 rounded-xl"
                  />
                </View>
              </View>
              <View className="w-28">
                <Text className="text-sm font-bold text-foreground mb-1.5">Huisnr.</Text>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Home size={20} color="hsl(213 20% 46%)" />
                  </View>
                  <Input
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    className="pl-12 h-14 rounded-xl"
                  />
                </View>
              </View>
            </View>
          </View>

          <Button
            onPress={() => saveMutation.mutate()}
            className="w-full h-14 rounded-xl"
            disabled={!firstName || !lastName || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 size={20} color="white" />
            ) : (
              <Text className="font-bold">Opslaan</Text>
            )}
          </Button>
        </View>
      </ScrollView>

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
