"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createLink, deleteLink, updateLink } from "@/modules/links/links.services";
import { validateLinkInput } from "@/modules/links/links.utils";

export type LinkActionState = {
  error: string | null;
};

export async function createLinkAction(
  _prevState: LinkActionState,
  formData: FormData
): Promise<LinkActionState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();

  const validationMessage = validateLinkInput({
    slug,
    destinationUrl,
    requireSlug: true,
  });
  if (validationMessage) {
    return { error: validationMessage };
  }

  try {
    await createLink({
      slug,
      destination_url: destinationUrl,
    });
    revalidatePath("/links");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the link.";
    return { error: message };
  }

  redirect("/links");
}

export async function updateLinkAction(
  _prevState: LinkActionState,
  formData: FormData
): Promise<LinkActionState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const destinationUrl = String(formData.get("destination_url") ?? "").trim();

  const validationMessage = validateLinkInput({
    slug,
    destinationUrl,
    requireSlug: false,
  });
  if (validationMessage) {
    return { error: validationMessage };
  }

  try {
    await updateLink(slug, {
      destination_url: destinationUrl,
    });
    revalidatePath("/links");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update the link.";
    return { error: message };
  }

  redirect("/links");
}

export async function deleteLinkAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    redirect("/links?error=Missing+slug+for+delete.");
  }

  try {
    await deleteLink(slug);
    revalidatePath("/links");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete this link.";
    redirect(`/links?error=${encodeURIComponent(message)}`);
  }

  redirect("/links");
}
