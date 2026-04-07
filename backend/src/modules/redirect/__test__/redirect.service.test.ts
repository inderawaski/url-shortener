import { test } from 'node:test'
import * as assert from 'node:assert'
import type { Link, PrismaClient } from '../../../../generated/prisma/client'
import { createRedirectService } from '../redirect.service'

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

test('getRedirectBySlug returns null for invalid slug', async () => {
  const service = createRedirectService(mockPrisma({}))
  const r = await service.getRedirectBySlug('bad slug')
  assert.equal(r, null)
})

test('getRedirectBySlug returns null when missing', async () => {
  const service = createRedirectService(
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

test('getRedirectBySlug returns id and destinationUrl', async () => {
  const service = createRedirectService(
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
    destinationUrl: 'https://dest.example'
  })
})

test('recordClick creates click and increments count', async () => {
  const calls: unknown[] = []
  const service = createRedirectService(
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
    ipAddress: '10.0.0.1',
    userAgent: 'jest'
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
