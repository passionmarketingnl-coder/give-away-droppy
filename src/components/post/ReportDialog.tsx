import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const REPORT_REASONS = [
  "Niet beschikbaar",
  "Onjuiste informatie",
  "Ongepaste inhoud",
  "Overig",
];

interface ReportDialogProps {
  postId: string;
}

const ReportDialog = ({ postId }: ReportDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async (reason: string) => {
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase.from("reports").insert({
      post_id: postId,
      reporter_user_id: user.id,
      reason,
    });

    setSubmitting(false);
    setOpen(false);

    if (error) {
      toast.error("Melding mislukt. Probeer het opnieuw.");
    } else {
      toast.success("Bedankt voor je melding. We bekijken dit zo snel mogelijk.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Flag className="w-4 h-4" />
          Meld dit product
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Waarom meld je dit?</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {REPORT_REASONS.map((reason) => (
            <Button
              key={reason}
              variant="outline"
              className="w-full justify-start h-12 rounded-xl font-medium"
              disabled={submitting}
              onClick={() => handleReport(reason)}
            >
              {reason}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
