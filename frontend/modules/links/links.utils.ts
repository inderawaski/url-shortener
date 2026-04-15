const SLUG_PATTERN = /^[a-zA-Z0-9-_]+$/;

export function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function validateLinkInput(input: {
  slug: string;
  destinationUrl: string;
  requireSlug: boolean;
}) {
  if (input.requireSlug && !input.slug) {
    return "Add a short name for your link.";
  }

  if (input.requireSlug && !SLUG_PATTERN.test(input.slug)) {
    return "Short names can use letters, numbers, hyphens, and underscores.";
  }

  if (!input.destinationUrl) {
    return "Add the page you want this link to open.";
  }

  try {
    const parsed = new URL(input.destinationUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Start the address with http:// or https://.";
    }
  } catch {
    return "That doesn't look like a valid web address.";
  }

  return null;
}

export function getPublicBackendBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL environment variable.");
  }
  return base.replace(/\/$/, "");
}
