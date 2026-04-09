export type LinkListItem = {
  slug: string;
  destination: string;
  clickCount: number;
  createdAt: string;
};

export type LinkDetails = {
  slug: string;
  destinationUrl: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
};

const API_BASE = process.env.LINKS_API_BASE_URL;

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

function requireApiBase() {
  if (!API_BASE) {
    throw new Error("Missing LINKS_API_BASE_URL environment variable.");
  }
  return API_BASE.replace(/\/$/, "");
}

type BackendError = { error?: string };

async function requestBackend(path: string, init?: RequestInit) {
  const base = requireApiBase();
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Unexpected API error";
    try {
      const payload = (await response.json()) as BackendError;
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Keep fallback message if body is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function listLinks() {
  return (await requestBackend("/internal-api/links")) as LinkListItem[];
}

export async function getLinkDetails(slug: string) {
  return (await requestBackend(`/internal-api/links/${slug}`)) as LinkDetails;
}

export async function createLink(input: {
  slug: string;
  destination_url: string;
}) {
  return (await requestBackend("/internal-api/links", {
    method: "POST",
    body: JSON.stringify(input),
  })) as LinkDetails;
}

export async function updateLink(
  slug: string,
  input: {
    destination_url: string;
  }
) {
  return (await requestBackend(`/internal-api/links/${slug}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })) as LinkDetails;
}

export async function deleteLink(slug: string) {
  return (await requestBackend(`/internal-api/links/${slug}`, {
    method: "DELETE",
  })) as { deleted: true };
}
