import { View } from 'react-native';

import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

export type StatusType =
  | 'active'
  | 'ending'
  | 'raffled'
  | 'reroll'
  | 'picked_up'
  | 'removed'
  | 'reported';

const statusConfig: Record<StatusType, { label: string; bgClass: string; textClass: string }> = {
  active: { label: 'Actief', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  ending: { label: 'Bijna afgelopen', bgClass: 'bg-droppy-gold/15', textClass: 'text-droppy-gold' },
  raffled: { label: 'Verloot', bgClass: 'bg-droppy-green/10', textClass: 'text-droppy-green' },
  reroll: { label: 'Herverloting', bgClass: 'bg-accent/10', textClass: 'text-accent' },
  picked_up: { label: 'Opgehaald', bgClass: 'bg-droppy-success/10', textClass: 'text-droppy-success' },
  removed: { label: 'Verwijderd', bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
  reported: { label: 'Gemeld', bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <View className={cn('px-2.5 py-1 rounded-full', config.bgClass, className)}>
      <Text className={cn('text-xs font-bold', config.textClass)}>{config.label}</Text>
    </View>
  );
}
