import { useState } from 'react';
import { View } from 'react-native';
import { Flag } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

const REPORT_REASONS = [
  'Niet beschikbaar',
  'Onjuiste informatie',
  'Ongepaste inhoud',
  'Overig',
];

interface ReportDialogProps {
  postId: string;
}

export default function ReportDialog({ postId }: ReportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleReport = async (reason: string) => {
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase.from('reports').insert({
      post_id: postId,
      reporter_user_id: user.id,
      reason,
    });

    setSubmitting(false);
    setOpen(false);

    if (error) {
      setFeedback('Melding mislukt. Probeer het opnieuw.');
    } else {
      setFeedback('Bedankt voor je melding. We bekijken dit zo snel mogelijk.');
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <View>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="flex-row gap-2 justify-start px-0">
            <Flag size={16} color="hsl(213 20% 46%)" />
            <Text className="text-sm text-muted-foreground">Meld dit product</Text>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Text>Waarom meld je dit?</Text>
            </DialogTitle>
          </DialogHeader>
          <View className="gap-2 mt-2">
            {REPORT_REASONS.map((reason) => (
              <Button
                key={reason}
                variant="outline"
                disabled={submitting}
                onPress={() => handleReport(reason)}
                className="w-full h-12 rounded-xl">
                <Text className="font-medium">{reason}</Text>
              </Button>
            ))}
          </View>
        </DialogContent>
      </Dialog>
      {feedback && (
        <View className="mt-2 p-2 rounded-lg bg-card border border-border">
          <Text className="text-xs text-foreground">{feedback}</Text>
        </View>
      )}
    </View>
  );
}
