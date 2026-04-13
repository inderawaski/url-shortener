export type LinkListItem = {
  slug: string
  destination: string
  clickCount: number
  createdAt: string
}

export type LinkDetail = {
  slug: string
  destinationUrl: string
  clickCount: number
  createdAt: string
  updatedAt: string
}

export type CreateLinkInput = {
  slug: string
  destinationUrl: string
}

export type UpdateLinkInput = {
  destinationUrl: string
}

export type LinkServiceError =
  | { code: 'INVALID_SLUG' }
  | { code: 'INVALID_DESTINATION_URL' }
  | { code: 'SLUG_TAKEN' }
  | { code: 'NOT_FOUND' }

export type LinkService = {
  createLink: (input: CreateLinkInput) => Promise<LinkDetail | LinkServiceError>
  updateLink: (
    slug: string,
    input: UpdateLinkInput
  ) => Promise<LinkDetail | LinkServiceError>
  deleteLink: (slug: string) => Promise<{ deleted: true } | LinkServiceError>
  listLinks: () => Promise<LinkListItem[]>
  getLinkDetails: (slug: string) => Promise<LinkDetail | LinkServiceError>
}

export type LinkRoutesOpts = {
  linkService?: LinkService
}