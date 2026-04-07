import { test } from 'node:test'
import * as assert from 'node:assert'
import type { Link, PrismaClient } from '../../../generated/prisma/client'
import { SLUG_PATTERN } from '../link.consts'
import { createLinkService } from '../link.service'

const baseDate = new Date('2026-01-01T00:00:00.000Z')

function linkRow (over: Partial<Link> = {}): Link {
  return {
    id: 'id-1',
    slug: 'abc',
    destinationUrl: 'https://example.com',
    clickCount: 0,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...over
  }
}

type LinkClientMock = {
  create?: (args: unknown) => Promise<Link>
  update?: (args: unknown) => Promise<Link>
  findUnique?: (args: unknown) => Promise<Link | null>
  findMany?: (args: unknown) => Promise<Link[]>
}

type ClickClientMock = {
  create?: (args: unknown) => Promise<unknown>
}

const prismaLinkDefaults: Required<LinkClientMock> = {
  create: async (_args: unknown) => linkRow(),
  update: async (_args: unknown) => linkRow(),
  findUnique: async (_args: unknown) => null,
  findMany: async (_args: unknown) => []
}

const prismaClickDefaults: Required<ClickClientMock> = {
  create: async (_args: unknown) => ({})
}

function mockPrisma (
  link: LinkClientMock = {},
  extras?: {
    click?: ClickClientMock
    $transaction?: (arg: unknown) => Promise<unknown>
  }
): PrismaClient {
  const $transaction =
    extras?.$transaction ??
    (async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg as Promise<unknown>[])
      }
      throw new Error('unexpected $transaction argument')
    })
  return {
    link: { ...prismaLinkDefaults, ...link },
    click: { ...prismaClickDefaults, ...extras?.click },
    $transaction
  } as unknown as PrismaClient
}

test('SLUG_PATTERN accepts alphanumeric, hyphen, underscore', () => {
  assert.equal(SLUG_PATTERN.test('aZ09-_'), true)
  assert.equal(SLUG_PATTERN.test('bad slug'), false)
  assert.equal(SLUG_PATTERN.test(''), false)
})

test('createLink rejects invalid slug', async () => {
  const service = createLinkService(mockPrisma({}))
  const r = await service.createLink({
    slug: 'x y',
    destination_url: 'https://a.com'
  })
  assert.deepEqual(r, { code: 'INVALID_SLUG' })
})

test('createLink rejects non-http(s) URL', async () => {
  const service = createLinkService(mockPrisma({}))
  const r = await service.createLink({
    slug: 'ok',
    destination_url: 'ftp://x.com'
  })
  assert.deepEqual(r, { code: 'INVALID_DESTINATION_URL' })
})

test('createLink persists and returns detail', async () => {
  const service = createLinkService(
    mockPrisma({
      create: async (args: unknown) => {
        assert.deepEqual(
          (args as { data: { slug: string; destinationUrl: string } }).data,
          {
            slug: 's',
            destinationUrl: 'https://b.com'
          }
        )
        return linkRow({
          slug: 's',
          destinationUrl: 'https://b.com',
          clickCount: 2
        })
      }
    })
  )
  const r = await service.createLink({
    slug: 's',
    destination_url: 'https://b.com'
  })
  assert.ok(!('code' in r))
  if ('code' in r) return
  assert.equal(r.slug, 's')
  assert.equal(r.destination_url, 'https://b.com')
  assert.equal(r.click_count, 2)
  assert.equal(r.created_at, baseDate.toISOString())
})

test('createLink maps unique violation to SLUG_TAKEN', async () => {
  const err = Object.assign(new Error('unique'), { code: 'P2002' })
  const service = createLinkService(
    mockPrisma({
      create: async (_args: unknown) => {
        throw err
      }
    })
  )
  const r = await service.createLink({
    slug: 'dup',
    destination_url: 'https://c.com'
  })
  assert.deepEqual(r, { code: 'SLUG_TAKEN' })
})

test('updateLink returns NOT_FOUND when slug missing', async () => {
  const notFound = Object.assign(new Error('nf'), { code: 'P2025' })
  const service = createLinkService(
    mockPrisma({
      update: async (_args: unknown) => {
        throw notFound
      }
    })
  )
  const r = await service.updateLink('gone', {
    destination_url: 'https://d.com'
  })
  assert.deepEqual(r, { code: 'NOT_FOUND' })
})

test('updateLink returns detail on success', async () => {
  const service = createLinkService(
    mockPrisma({
      update: async (args: unknown) => {
        const a = args as {
          where: { slug: string }
          data: { destinationUrl: string }
        }
        assert.equal(a.where.slug, 'x')
        assert.deepEqual(a.data, { destinationUrl: 'https://new.com' })
        return linkRow({ slug: 'x', destinationUrl: 'https://new.com' })
      }
    })
  )
  const r = await service.updateLink('x', {
    destination_url: 'https://new.com'
  })
  assert.ok(!('code' in r))
  if ('code' in r) return
  assert.equal(r.destination_url, 'https://new.com')
})

test('listLinks maps rows to list shape', async () => {
  const service = createLinkService(
    mockPrisma({
      findMany: async (args: unknown) => {
        assert.deepEqual(
          (args as { orderBy?: unknown } | undefined)?.orderBy,
          { createdAt: 'desc' }
        )
        return [
          linkRow({ slug: 'a', destinationUrl: 'https://a.io', clickCount: 1 })
        ]
      }
    })
  )
  const list = await service.listLinks()
  assert.equal(list.length, 1)
  assert.deepEqual(list[0], {
    slug: 'a',
    destination: 'https://a.io',
    click_count: 1,
    created_at: baseDate.toISOString()
  })
})

test('getLinkDetails returns NOT_FOUND', async () => {
  const service = createLinkService(
    mockPrisma({
      findUnique: async (_args: unknown) => null
    })
  )
  const r = await service.getLinkDetails('nope')
  assert.deepEqual(r, { code: 'NOT_FOUND' })
})

test('getLinkDetails returns detail', async () => {
  const service = createLinkService(
    mockPrisma({
      findUnique: async (args: unknown) => {
        assert.equal((args as { where: { slug: string } }).where.slug, 'z')
        return linkRow({ slug: 'z' })
      }
    })
  )
  const r = await service.getLinkDetails('z')
  assert.ok(!('code' in r))
  if ('code' in r) return
  assert.equal(r.slug, 'z')
})

test('getRedirectBySlug returns null for invalid slug', async () => {
  const service = createLinkService(mockPrisma({}))
  const r = await service.getRedirectBySlug('bad slug')
  assert.equal(r, null)
})

test('getRedirectBySlug returns null when missing', async () => {
  const service = createLinkService(
    mockPrisma({
      findUnique: async (args: unknown) => {
        assert.deepEqual((args as { select?: unknown }).select, {
          id: true,
          destinationUrl: true
        })
        return null
      }
    })
  )
  const r = await service.getRedirectBySlug('gone')
  assert.equal(r, null)
})

test('getRedirectBySlug returns id and destination_url', async () => {
  const service = createLinkService(
    mockPrisma({
      findUnique: async (_args: unknown) =>
        linkRow({
          id: 'lid',
          slug: 's',
          destinationUrl: 'https://dest.example'
        })
    })
  )
  const r = await service.getRedirectBySlug('s')
  assert.deepEqual(r, {
    id: 'lid',
    destination_url: 'https://dest.example'
  })
})

test('recordClick creates click and increments count', async () => {
  const calls: unknown[] = []
  const service = createLinkService(
    mockPrisma(
      {
        update: async (args: unknown) => {
          calls.push({ kind: 'update', args })
          return linkRow()
        }
      },
      {
        click: {
          create: async (args: unknown) => {
            calls.push({ kind: 'create', args })
            return {}
          }
        },
        $transaction: async (arg: unknown) => {
          const ops = arg as Promise<unknown>[]
          return Promise.all(ops)
        }
      }
    )
  )
  await service.recordClick('lid', {
    ip_address: '10.0.0.1',
    user_agent: 'jest'
  })
  assert.equal(calls.length, 2)
  const createCall = calls.find(c => (c as { kind: string }).kind === 'create') as {
    args: { data: Record<string, unknown> }
  }
  assert.deepEqual(createCall.args.data.linkId, 'lid')
  assert.equal(createCall.args.data.ipAddress, '10.0.0.1')
  assert.equal(createCall.args.data.userAgent, 'jest')
  assert.ok(createCall.args.data.Timestamp instanceof Date)
  const updateCall = calls.find(c => (c as { kind: string }).kind === 'update') as {
    args: { where: { id: string }; data: { clickCount: { increment: number } } }
  }
  assert.deepEqual(updateCall.args.where, { id: 'lid' })
  assert.deepEqual(updateCall.args.data, { clickCount: { increment: 1 } })
})
