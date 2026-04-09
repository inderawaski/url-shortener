"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type LinkListItem = {
  slug: string;
  destination: string;
  clickCount: number;
  createdAt: string;
};

type LinkDetails = {
  slug: string;
  destinationUrl: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
};

type ApiError = { error?: string };
type Mode = "create" | "edit";

const SLUG_PATTERN = /^[a-zA-Z0-9-_]+$/;

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function Home() {
  const [links, setLinks] = useState<LinkListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("create");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkDetails | null>(null);
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LinkListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchLinks() {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const response = await fetch("/api/links", { cache: "no-store" });
      const payload = (await response.json()) as LinkListItem[] | ApiError;
      if (!response.ok) {
        throw new Error((payload as ApiError).error ?? "Unable to load your links.");
      }
      setLinks(payload as LinkListItem[]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load your links.";
      setErrorBanner(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchLinks();
  }, []);

  const editorTitle = useMemo(
    () => (mode === "create" ? "Create a short link" : "Update destination URL"),
    [mode]
  );

  const editorDescription = useMemo(
    () =>
      mode === "create"
        ? "Add a new short link by providing a unique slug and a destination URL."
        : "Only destination URL is editable. Slug remains unchanged.",
    [mode]
  );

  function validateCreatePayload() {
    if (!slug) return "Slug is required.";
    if (!SLUG_PATTERN.test(slug)) {
      return "Slug can only include letters, numbers, hyphens, and underscores.";
    }
    if (!destinationUrl) return "Destination URL is required.";
    try {
      const parsed = new URL(destinationUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "Destination URL must start with http:// or https://.";
      }
    } catch {
      return "Destination URL must be a valid URL.";
    }
    return null;
  }

  async function openCreateModal() {
    setMode("create");
    setSelectedLink(null);
    setSlug("");
    setDestinationUrl("");
    setFormError(null);
    setIsEditorOpen(true);
  }

  async function openEditModal(targetSlug: string) {
    setMode("edit");
    setFormError(null);
    try {
      const response = await fetch(`/api/links/${targetSlug}`, { cache: "no-store" });
      const payload = (await response.json()) as LinkDetails | ApiError;
      if (!response.ok) {
        throw new Error((payload as ApiError).error ?? "Unable to fetch link details.");
      }
      const details = payload as LinkDetails;
      setSelectedLink(details);
      setSlug(details.slug);
      setDestinationUrl(details.destinationUrl);
      setIsEditorOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch link details.";
      setErrorBanner(message);
    }
  }

  async function handleSubmit() {
    setFormError(null);
    const validationMessage = validateCreatePayload();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const response = await fetch("/api/links", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, destination_url: destinationUrl }),
        });
        const payload = (await response.json()) as LinkDetails | ApiError;
        if (!response.ok) {
          throw new Error((payload as ApiError).error ?? "Unable to create the link.");
        }
      } else {
        const response = await fetch(`/api/links/${slug}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ destination_url: destinationUrl }),
        });
        const payload = (await response.json()) as LinkDetails | ApiError;
        if (!response.ok) {
          throw new Error((payload as ApiError).error ?? "Unable to update the link.");
        }
      }
      setIsEditorOpen(false);
      await fetchLinks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save this link.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDeleteDialog(link: LinkListItem) {
    setDeleteTarget(link);
    setIsDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/links/${deleteTarget.slug}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { deleted: true } | ApiError;
      if (!response.ok) {
        throw new Error((payload as ApiError).error ?? "Unable to delete this link.");
      }
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await fetchLinks();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete this link.";
      setErrorBanner(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">URL Shortener Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage short links, update destinations, and remove outdated entries.
            </p>
          </div>
          <Button onClick={openCreateModal}>Add New Link</Button>
        </header>

        {errorBanner ? (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/70 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorBanner}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Existing Links</CardTitle>
            <CardDescription>
              Minimal list view with slug, destination, click count, and creation date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading links...</p>
            ) : links.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No links yet. Create your first short URL to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short URL</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.slug}>
                      <TableCell className="font-medium">
                        <a
                          href={`/api/redirect/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline dark:text-blue-300"
                        >
                          sho.rt/{link.slug}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[350px] truncate">{link.destination}</TableCell>
                      <TableCell>{link.clickCount}</TableCell>
                      <TableCell>{formatDate(link.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => void openEditModal(link.slug)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(link)}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editorTitle}</DialogTitle>
            <DialogDescription>{editorDescription}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="summer-sale-2026"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                readOnly={mode === "edit"}
                aria-describedby="slug-help"
              />
              <p id="slug-help" className="text-xs text-zinc-500 dark:text-zinc-400">
                Allowed characters: letters, numbers, hyphens, and underscores.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination_url">Destination URL</Label>
              <Input
                id="destination_url"
                type="url"
                placeholder="https://example.com/landing-page"
                value={destinationUrl}
                onChange={(event) => setDestinationUrl(event.target.value)}
                aria-describedby="destination-help"
              />
              <p id="destination-help" className="text-xs text-zinc-500 dark:text-zinc-400">
                HTTP and HTTPS URLs are accepted.
              </p>
            </div>

            {mode === "edit" && selectedLink ? (
              <dl className="grid grid-cols-1 gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Created at</dt>
                  <dd>{formatDate(selectedLink.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Updated at</dt>
                  <dd>{formatDate(selectedLink.updatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Click count</dt>
                  <dd>{selectedLink.clickCount}</dd>
                </div>
              </dl>
            ) : null}

            {formError ? (
              <p
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/70 dark:bg-red-950/40 dark:text-red-300"
              >
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : mode === "create" ? "Create Link" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete link?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.slug}</strong> and its destination mapping.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Keep Link
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Yes, Delete Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
