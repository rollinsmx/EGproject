import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { saveEntry, getEntries, type WeightEntry } from "@/lib/sheets.functions";
import { queryOptions } from "@tanstack/react-query";

const entriesQuery = queryOptions({
  queryKey: ["entries"],
  queryFn: () => getEntries(),
});

export function EntryForm() {
  const { data } = useSuspenseQuery(entriesQuery);
  const [open, setOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmOverwrite, setConfirmOverwrite] = useState<null | WeightEntry>(null);

  const existingForDate = data.entries.find((e) => e.date === date) ?? null;
  const todayEntry = data.entries.find((e) => e.date === today) ?? null;
  const isEditing = !!existingForDate;

  // Prefill when dialog opens or date changes
  useEffect(() => {
    if (!open) return;
    if (existingForDate) {
      setWeight(existingForDate.weight.toString().replace(".", ","));
      setNotes(existingForDate.notes ?? "");
    } else {
      setWeight("");
      setNotes("");
    }
  }, [open, date, existingForDate]);

  const qc = useQueryClient();
  const saveFn = useServerFn(saveEntry);
  const mutation = useMutation({
    mutationFn: (input: {
      date: string;
      weight: number;
      notes: string;
      overwrite?: boolean;
    }) => saveFn({ data: input }),
    onSuccess: (res, vars) => {
      if (res.status === "duplicate") {
        setConfirmOverwrite(existingForDate);
        return;
      }
      toast.success(res.status === "updated" ? "Entry updated" : "Entry saved");
      qc.invalidateQueries({ queryKey: ["entries"] });
      setOpen(false);
      setConfirmOverwrite(null);
      if (!vars.overwrite) {
        setWeight("");
        setNotes("");
      }
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
    mutation.mutate({ date, weight: w, notes, overwrite: isEditing });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-full h-10 px-5 gap-2 bg-foreground text-background hover:bg-foreground/90">
            {todayEntry ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {todayEntry ? "Edit today" : "Log weight"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Update entry" : "New entry"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? `Editing existing entry for ${format(new Date(date), "MMM d, yyyy")}.`
                : "Record a weight in a few seconds."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
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
              {mutation.isPending
                ? "Saving…"
                : isEditing
                  ? "Update entry"
                  : "Save entry"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmOverwrite}
        onOpenChange={(o) => !o && setConfirmOverwrite(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite existing entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOverwrite
                ? `An entry for ${format(new Date(confirmOverwrite.date), "MMM d, yyyy")} already exists (${confirmOverwrite.weight.toFixed(1)} kg). Do you want to replace it?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={() => {
                const w = parseFloat(weight.replace(",", "."));
                if (!Number.isFinite(w)) return;
                mutation.mutate({ date, weight: w, notes, overwrite: true });
              }}
            >
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
