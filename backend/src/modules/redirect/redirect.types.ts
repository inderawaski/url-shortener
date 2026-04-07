export type RecordClickInput = {
  ipAddress: string
  userAgent: string
}

export type RedirectTarget = {
  id: string
  destinationUrl: string
}

export type RedirectService = {
  getRedirectBySlug: (slug: string) => Promise<RedirectTarget | null>
  recordClick: (linkId: string, meta: RecordClickInput) => Promise<void>
}

export type RedirectRoutesOpts = {
  redirectService?: RedirectService
}
