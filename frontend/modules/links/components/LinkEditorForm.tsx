"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  type LinkActionState,
  createLinkAction,
  updateLinkAction,
} from "@/modules/links/links.actions";
import { SubmitButton } from "@/modules/links/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LinkEditorFormProps = {
  mode: "create" | "edit";
  slug: string;
  destinationUrl: string;
};

export function LinkEditorForm({ mode, slug, destinationUrl }: LinkEditorFormProps) {
  const serverAction = mode === "edit" ? updateLinkAction : createLinkAction;
  const isEditMode = mode === "edit";
  const [state, action] = useActionState<LinkActionState, FormData>(
    serverAction,
    { error: null }
  );

  return (
    <form action={action} className="space-y-4">
      {isEditMode ? <input type="hidden" name="slug" value={slug} /> : null}
      <div className="space-y-2">
        <Label htmlFor="slug">Short name</Label>
        <Input
          id="slug"
          name={isEditMode ? undefined : "slug"}
          placeholder="summer-sale-2026"
          defaultValue={slug}
          readOnly={isEditMode}
          disabled={isEditMode}
          className={
            isEditMode
              ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500 opacity-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              : undefined
          }
          aria-describedby="slug-help"
        />
        <p id="slug-help" className="text-xs text-zinc-500 dark:text-zinc-400">
          Letters, numbers, hyphens, and underscores—whatever feels easy to say out loud.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination_url">Where it should go</Label>
        <Input
          id="destination_url"
          name="destination_url"
          type="url"
          placeholder="https://example.com/landing-page"
          defaultValue={destinationUrl}
          aria-describedby="destination-help"
        />
        <p id="destination-help" className="text-xs text-zinc-500 dark:text-zinc-400">
          Paste the full address, including https:// or http://.
        </p>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/70 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button asChild type="button" variant="outline">
          <Link href="/links">Cancel</Link>
        </Button>
        {mode === "edit" ? (
          <SubmitButton idleLabel="Save Changes" pendingLabel="Saving..." />
        ) : (
          <SubmitButton idleLabel="Create link" pendingLabel="Creating..." />
        )}
      </div>
    </form>
  );
}
