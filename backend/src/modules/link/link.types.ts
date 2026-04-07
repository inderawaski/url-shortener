export type LinkListItem = {
  slug: string
  destination: string
  click_count: number
  created_at: string
}

export type LinkDetail = {
  slug: string
  destination_url: string
  click_count: number
  created_at: string
  updated_at: string
}

export type CreateLinkInput = {
  slug: string
  destination_url: string
}

export type UpdateLinkInput = {
  destination_url: string
}

export type LinkServiceError =
  | { code: 'INVALID_SLUG' }
  | { code: 'INVALID_DESTINATION_URL' }
  | { code: 'SLUG_TAKEN' }
  | { code: 'NOT_FOUND' }

export type RecordClickInput = {
  ip_address: string
  user_agent: string
}

export type RedirectTarget = {
  id: string
  destination_url: string
}

export type LinkService = {
  createLink: (input: CreateLinkInput) => Promise<LinkDetail | LinkServiceError>
  updateLink: (
    slug: string,
    input: UpdateLinkInput
  ) => Promise<LinkDetail | LinkServiceError>
  listLinks: () => Promise<LinkListItem[]>
  getLinkDetails: (slug: string) => Promise<LinkDetail | LinkServiceError>
  getRedirectBySlug: (slug: string) => Promise<RedirectTarget | null>
  recordClick: (linkId: string, meta: RecordClickInput) => Promise<void>
}

export type LinkRoutesOpts = {
  linkService?: LinkService
}