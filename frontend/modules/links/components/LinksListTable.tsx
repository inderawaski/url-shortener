"use client";

import Link from "next/link";
import { useState } from "react";

import type { LinkListItem } from "@/modules/links/links.types";
import { DeleteLinkModal } from "@/modules/links/components/DeleteLinkModal";
import { formatDate } from "@/modules/links/links.utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type LinksListTableProps = {
  links: LinkListItem[];
  backendBaseUrl: string;
};

export function LinksListTable({ links, backendBaseUrl }: LinksListTableProps) {
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
console.log(isDeleteModalOpen)
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short link</TableHead>
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
                  shor.ty/{link.slug}
                </a>
              </TableCell>
              <TableCell className="max-w-[350px]">
                <a
                  href={link.destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-blue-700 hover:underline dark:text-blue-300"
                  title={link.destination}
                >
                  {link.destination}
                </a>
              </TableCell>
              <TableCell>{link.clickCount}</TableCell>
              <TableCell>{formatDate(link.createdAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/links/${link.slug}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      console.log("a")
                      setDeleteSlug(link.slug);
                      window.setTimeout(() => setIsDeleteModalOpen(true), 0);
                    }}
                    className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteLinkModal
        slug={deleteSlug}
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            setDeleteSlug(null);
          }
        }}
      />
    </>
  );
}
