import { ScrollView } from 'react-native';

import { TermsContent } from '@/components/legal/LegalContent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

interface TermsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TermsSheet({ open, onOpenChange }: TermsSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>
            <Text className="text-xl font-extrabold">Algemene Voorwaarden</Text>
          </DialogTitle>
        </DialogHeader>
        <ScrollView className="px-6" contentContainerClassName="pb-10 gap-4">
          <TermsContent />
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
