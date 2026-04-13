import type { Link, PrismaClient } from '../../../generated/prisma/client'
import { SLUG_PATTERN } from './links.consts'
import type {
  CreateLinkInput,
  LinkDetail,
  LinkListItem,
  LinkService,
  UpdateLinkInput
} from './links.types'

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
    destinationUrl: row.destinationUrl,
    clickCount: row.clickCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

function toListItem (row: Link): LinkListItem {
  return {
    slug: row.slug,
    destination: row.destinationUrl,
    clickCount: row.clickCount,
    createdAt: row.createdAt.toISOString()
  }
}

export function createLinkService (prisma: PrismaClient): LinkService {
  return {
    async createLink (input: CreateLinkInput) {
      if (!SLUG_PATTERN.test(input.slug)) {
        return { code: 'INVALID_SLUG' }
      }
      if (!assertValidDestinationUrl(input.destinationUrl)) {
        return { code: 'INVALID_DESTINATION_URL' }
      }

      try {
        const row = await prisma.link.create({
          data: {
            slug: input.slug,
            destinationUrl: input.destinationUrl
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
      if (!assertValidDestinationUrl(input.destinationUrl)) {
        return { code: 'INVALID_DESTINATION_URL' }
      }

      try {
        const row = await prisma.link.update({
          where: { slug },
          data: { destinationUrl: input.destinationUrl }
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

    async deleteLink (slug: string) {
      if (!SLUG_PATTERN.test(slug)) {
        return { code: 'INVALID_SLUG' }
      }

      try {
        await prisma.link.delete({ where: { slug } })
        return { deleted: true as const }
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
    }
  }
}
