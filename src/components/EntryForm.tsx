import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addEntry } from "@/lib/sheets.functions";

export function EntryForm() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const qc = useQueryClient();
  const addFn = useServerFn(addEntry);
  const mutation = useMutation({
    mutationFn: (input: { date: string; weight: number; notes: string }) =>
      addFn({ data: input }),
    onSuccess: () => {
      toast.success("Entry saved");
      qc.invalidateQueries({ queryKey: ["entries"] });
      setWeight("");
      setNotes("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not save"),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight.replace(",", "."));
    if (!Number.isFinite(w)) {
      toast.error("Enter a valid weight");
      return;
    }
    mutation.mutate({ date, weight: w, notes });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full h-10 px-5 gap-2 bg-foreground text-background hover:bg-foreground/90">
          <Plus className="h-4 w-4" />
          Log weight
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">New entry</DialogTitle>
          <DialogDescription>Record today's weight in a few seconds.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), "yyyy-MM-dd")}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="e.g. 88.4"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              autoFocus
              className="h-11 rounded-xl num text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90"
          >
            {mutation.isPending ? "Saving…" : "Save entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
