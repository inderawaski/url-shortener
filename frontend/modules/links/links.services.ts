import "server-only";

import axios from "axios";

import { LinksApiError, type LinkDetails, type LinkListItem } from "@/modules/links/links.types";
import { getPublicBackendBaseUrl } from "@/modules/links/links.utils";

type BackendError = { error?: string };

const LINKS_API_PATH = "/links";

async function requestBackend<T>(config: {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}) {
  const hasBody = config.body !== undefined;

  try {
    const response = await axios.request<T>({
      baseURL: getPublicBackendBaseUrl(),
      url: config.path,
      method: config.method ?? "GET",
      data: config.body,
      headers: hasBody ? { "content-type": "application/json" } : undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<BackendError>(error)) {
      throw new LinksApiError(
        error.response?.data?.error ?? "Unexpected API error",
        error.response?.status ?? 500
      );
    }
    throw new LinksApiError("Unexpected API error", 500);
  }
}

export async function listLinks() {
  return requestBackend<LinkListItem[]>({
    path: LINKS_API_PATH,
  });
}

export async function getLinkDetails(slug: string) {
  return requestBackend<LinkDetails>({
    path: `${LINKS_API_PATH}/${slug}`,
  });
}

export async function createLink(input: {
  slug: string;
  destination_url: string;
}) {
  return requestBackend<LinkDetails>({
    path: LINKS_API_PATH,
    method: "POST",
    body: input,
  });
}

export async function updateLink(
  slug: string,
  input: {
    destination_url: string;
  }
) {
  return requestBackend<LinkDetails>({
    path: `${LINKS_API_PATH}/${slug}`,
    method: "PATCH",
    body: input,
  });
}

export async function deleteLink(slug: string) {
  return requestBackend<{ deleted: true }>({
    path: `${LINKS_API_PATH}/${slug}`,
    method: "DELETE",
  });
}
