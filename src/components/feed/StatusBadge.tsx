import { cn } from "@/lib/utils";

type StatusType = "active" | "ending" | "raffled" | "reroll" | "picked_up" | "removed" | "reported";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: "Actief", className: "bg-droppy-teal-light text-primary" },
  ending: { label: "Bijna afgelopen", className: "bg-droppy-gold/15 text-droppy-gold" },
  raffled: { label: "Verloot", className: "bg-primary/10 text-primary" },
  reroll: { label: "Herverloting", className: "bg-accent/10 text-accent" },
  picked_up: { label: "Opgehaald", className: "bg-droppy-success/10 text-droppy-success" },
  removed: { label: "Verwijderd", className: "bg-muted text-muted-foreground" },
  reported: { label: "Gemeld", className: "bg-destructive/10 text-destructive" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
export type { StatusType };
