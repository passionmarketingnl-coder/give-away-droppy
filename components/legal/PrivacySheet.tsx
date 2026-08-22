import { ScrollView } from 'react-native';

import { PrivacyContent } from '@/components/legal/LegalContent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

interface PrivacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrivacySheet({ open, onOpenChange }: PrivacySheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>
            <Text className="text-xl font-extrabold">Privacybeleid</Text>
          </DialogTitle>
        </DialogHeader>
        <ScrollView className="px-6" contentContainerClassName="pb-10 gap-4">
          <PrivacyContent />
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
