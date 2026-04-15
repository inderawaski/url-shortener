"use client";

import { deleteLinkAction } from "@/modules/links/links.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteLinkModalProps = {
  slug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteLinkModal({ slug, open, onOpenChange }: DeleteLinkModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete link?</DialogTitle>
          <DialogDescription>
            You are about to delete{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{slug ?? ""}</span>. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <form action={deleteLinkAction}>
            <input type="hidden" name="slug" value={slug ?? ""} />
            <Button
              variant="ghost"
              type="submit"
              disabled={!slug}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
            >
              Confirm delete
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
