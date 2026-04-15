import Link from "next/link";

import { LinksListTable } from "@/modules/links/components/LinksListTable";
import { listLinks } from "@/modules/links/links.services";
import { getPublicBackendBaseUrl } from "@/modules/links/links.utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LinksListPageProps = {
  errorMessage?: string;
};

export async function LinksListPage({ errorMessage }: LinksListPageProps) {
  const links = await listLinks();
  const backendBaseUrl = getPublicBackendBaseUrl();

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">URL Shortener</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Share something short, point it somewhere new when plans change, and retire what you
              no longer need.
            </p>
          </div>
          <Button asChild>
            <Link href="/links/new">New Link</Link>
          </Button>
        </header>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/70 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
            <CardDescription>
              Tap a short URL to open it—clicks and dates are here when you want the story behind the
              numbers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No links yet. Add a short link and it&apos;ll show up in this list.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="border-zinc-200 bg-white text-zinc-950 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  <Link href="/links/new">Create Link</Link>
                </Button>
              </div>
            ) : (
              <LinksListTable links={links} backendBaseUrl={backendBaseUrl} />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
