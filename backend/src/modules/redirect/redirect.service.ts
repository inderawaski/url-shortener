import type { PrismaClient } from '../../../generated/prisma/client'
import { SLUG_PATTERN } from '../links/links.consts'
import type { RecordClickInput, RedirectService } from './redirect.types'

export function createRedirectService (prisma: PrismaClient): RedirectService {
  return {
    async getRedirectBySlug (slug: string) {
      if (!SLUG_PATTERN.test(slug)) {
        return null
      }
      const row = await prisma.link.findUnique({
        where: { slug },
        select: { id: true, destinationUrl: true }
      })
      if (!row) {
        return null
      }
      return {
        id: row.id,
        destinationUrl: row.destinationUrl
      }
    },

    async recordClick (linkId: string, meta: RecordClickInput) {
      const ts = new Date()
      await prisma.$transaction([
        prisma.click.create({
          data: {
            linkId,
            Timestamp: ts,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent
          }
        }),
        prisma.link.update({
          where: { id: linkId },
          data: { clickCount: { increment: 1 } }
        })
      ])
    }
  }
}
