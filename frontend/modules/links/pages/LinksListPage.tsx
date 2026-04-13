import Link from "next/link";

import { deleteLinkAction } from "@/modules/links/links.actions";
import { listLinks } from "@/modules/links/links.services";
import { formatDate, getPublicBackendBaseUrl } from "@/modules/links/links.utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
            <h1 className="text-3xl font-semibold tracking-tight">URL Shortener Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage short links, update destinations, and remove outdated entries.
            </p>
          </div>
          <Button asChild>
            <Link href="/links/new">Add New Link</Link>
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
            <CardTitle>Existing Links</CardTitle>
            <CardDescription>
              Minimal list view with slug, destination, click count, and creation date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No links yet. Create your first short URL to get started.
                </p>
                <Button asChild variant="outline">
                  <Link href="/links/new">Create Link</Link>
                </Button>
              </div>
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
                          href={`${backendBaseUrl}/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline dark:text-blue-300"
                        >
                          {backendBaseUrl}/{link.slug}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[350px] truncate">{link.destination}</TableCell>
                      <TableCell>{link.clickCount}</TableCell>
                      <TableCell>{formatDate(link.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/links/${link.slug}/edit`}>Edit</Link>
                          </Button>
                          <form action={deleteLinkAction}>
                            <input type="hidden" name="slug" value={link.slug} />
                            <Button variant="destructive" size="sm" type="submit">
                              Delete
                            </Button>
                          </form>
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
    </main>
  );
}
