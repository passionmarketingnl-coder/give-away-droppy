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
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, Home, Loader2, MapPin } from 'lucide-react-native';

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
        <Loader2 size={32} color="hsl(231 100% 71%)" />
      </View>
    );
  }

  const initials = firstName ? `${firstName.charAt(0)}${lastName.charAt(0)}` : '?';
  const canSave = firstName && lastName && !saveMutation.isPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Brand app-header (full-width) */}
      <View style={{ backgroundColor: "#18193f" }} className="pt-4 pb-5">
        <View className="max-w-lg mx-auto w-full px-4 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
          <Text className="text-2xl font-heading text-white">Profiel bewerken</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled">
        <View className="max-w-lg mx-auto w-full px-4 py-6 gap-6">
          <View className="items-center gap-3">
            <Pressable onPress={pickAvatar} className="relative">
              {/* Gradient ring rond de avatar (logo blauw→roze) */}
              <LinearGradient
                colors={['#6880FF', '#F65FE7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  padding: 3,
                }}>
                <View className="flex-1 rounded-full overflow-hidden bg-background items-center justify-center">
                  {avatarPreview ? (
                    <Image source={{ uri: avatarPreview }} className="w-full h-full" />
                  ) : (
                    <Text className="text-primary font-heading text-3xl">{initials}</Text>
                  )}
                </View>
              </LinearGradient>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full overflow-hidden">
                <LinearGradient
                  colors={['#6880FF', '#F65FE7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={16} color="white" />
                </LinearGradient>
              </View>
            </Pressable>
            <Pressable onPress={pickAvatar}>
              <Text className="text-sm text-primary font-poppins-600">Foto wijzigen</Text>
            </Pressable>
          </View>

          <View className="gap-4">
            <View>
              <Text className="text-sm font-poppins-700 text-foreground mb-1.5">Voornaam</Text>
              <Input
                value={firstName}
                onChangeText={setFirstName}
                className="h-12 rounded-full px-5"
              />
            </View>
            <View>
              <Text className="text-sm font-poppins-700 text-foreground mb-1.5">Achternaam</Text>
              <Input
                value={lastName}
                onChangeText={setLastName}
                className="h-12 rounded-full px-5"
              />
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-poppins-700 text-foreground mb-1.5">Postcode</Text>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <MapPin size={18} color="hsl(232 15% 55%)" />
                  </View>
                  <Input
                    value={postcode}
                    onChangeText={setPostcode}
                    autoCapitalize="characters"
                    maxLength={7}
                    className="pl-11 h-12 rounded-full"
                  />
                </View>
              </View>
              <View className="w-28">
                <Text className="text-sm font-poppins-700 text-foreground mb-1.5">Huisnr.</Text>
                <View className="relative">
                  <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Home size={18} color="hsl(232 15% 55%)" />
                  </View>
                  <Input
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    className="pl-11 h-12 rounded-full"
                  />
                </View>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => saveMutation.mutate()}
            disabled={!canSave}
            className={`w-full h-14 rounded-full overflow-hidden ${
              !canSave ? 'opacity-50' : ''
            }`}
            style={
              canSave
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
              {saveMutation.isPending ? (
                <Loader2 size={20} color="white" />
              ) : (
                <Text className="font-poppins-700 text-base text-white">Opslaan</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

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
