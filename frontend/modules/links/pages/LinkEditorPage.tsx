import Link from "next/link";

import { LinkEditorForm } from "@/modules/links/components/LinkEditorForm";
import { getLinkDetails } from "@/modules/links/links.services";
import { formatDate } from "@/modules/links/links.utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LinkEditorPageProps = {
  slug?: string;
};

export async function LinkEditorPage({ slug }: LinkEditorPageProps) {
  const isEditMode = Boolean(slug);
  const details = slug ? await getLinkDetails(slug) : null;

  const title = isEditMode ? "Update destination URL" : "Create a short link";
  const description = isEditMode
    ? "Only destination URL is editable. Slug remains unchanged."
    : "Add a new short link by providing a unique slug and a destination URL.";

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/links">Back to Links</Link>
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Link" : "New Link"}</CardTitle>
            <CardDescription>HTTP and HTTPS URLs are accepted.</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkEditorForm
              mode={isEditMode ? "edit" : "create"}
              slug={details?.slug ?? ""}
              destinationUrl={details?.destinationUrl ?? ""}
            />
          </CardContent>
        </Card>

        {isEditMode && details ? (
          <Card>
            <CardHeader>
              <CardTitle>Link Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Created at</dt>
                  <dd>{formatDate(details.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Updated at</dt>
                  <dd>{formatDate(details.updatedAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">Click count</dt>
                  <dd>{details.clickCount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
