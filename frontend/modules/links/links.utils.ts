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
    return "Slug is required.";
  }

  if (input.requireSlug && !SLUG_PATTERN.test(input.slug)) {
    return "Slug can only include letters, numbers, hyphens, and underscores.";
  }

  if (!input.destinationUrl) {
    return "Destination URL is required.";
  }

  try {
    const parsed = new URL(input.destinationUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Destination URL must start with http:// or https://.";
    }
  } catch {
    return "Destination URL must be a valid URL.";
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
