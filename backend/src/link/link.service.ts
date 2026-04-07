import type { Link, PrismaClient } from '../../generated/prisma/client'
import { SLUG_PATTERN } from './link.consts'
import type {
  CreateLinkInput,
  LinkDetail,
  LinkListItem,
  LinkService,
  RecordClickInput,
  UpdateLinkInput
} from './link.types'

function assertValidDestinationUrl (url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function toDetail (row: Link): LinkDetail {
  return {
    slug: row.slug,
    destination_url: row.destinationUrl,
    click_count: row.clickCount,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  }
}

function toListItem (row: Link): LinkListItem {
  return {
    slug: row.slug,
    destination: row.destinationUrl,
    click_count: row.clickCount,
    created_at: row.createdAt.toISOString()
  }
}

export function createLinkService (prisma: PrismaClient): LinkService {
  return {
    async createLink (input: CreateLinkInput) {
      if (!SLUG_PATTERN.test(input.slug)) {
        return { code: 'INVALID_SLUG' }
      }
      if (!assertValidDestinationUrl(input.destination_url)) {
        return { code: 'INVALID_DESTINATION_URL' }
      }

      try {
        const row = await prisma.link.create({
          data: {
            slug: input.slug,
            destinationUrl: input.destination_url
          }
        })
        return toDetail(row)
      } catch (e: unknown) {
        if (
          e !== null &&
          typeof e === 'object' &&
          'code' in e &&
          e.code === 'P2002'
        ) {
          return { code: 'SLUG_TAKEN' }
        }
        throw e
      }
    },

    async updateLink (slug: string, input: UpdateLinkInput) {
      if (!SLUG_PATTERN.test(slug)) {
        return { code: 'INVALID_SLUG' }
      }
      if (!assertValidDestinationUrl(input.destination_url)) {
        return { code: 'INVALID_DESTINATION_URL' }
      }

      try {
        const row = await prisma.link.update({
          where: { slug },
          data: { destinationUrl: input.destination_url }
        })
        return toDetail(row)
      } catch (e: unknown) {
        if (
          e !== null &&
          typeof e === 'object' &&
          'code' in e &&
          e.code === 'P2025'
        ) {
          return { code: 'NOT_FOUND' }
        }
        throw e
      }
    },

    async listLinks () {
      const rows = await prisma.link.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return rows.map(toListItem)
    },

    async getLinkDetails (slug: string) {
      if (!SLUG_PATTERN.test(slug)) {
        return { code: 'INVALID_SLUG' }
      }
      const row = await prisma.link.findUnique({ where: { slug } })
      if (!row) {
        return { code: 'NOT_FOUND' }
      }
      return toDetail(row)
    },

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
        destination_url: row.destinationUrl
      }
    },

    async recordClick (linkId: string, meta: RecordClickInput) {
      const ts = new Date()
      await prisma.$transaction([
        prisma.click.create({
          data: {
            linkId,
            Timestamp: ts,
            ipAddress: meta.ip_address,
            userAgent: meta.user_agent
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
