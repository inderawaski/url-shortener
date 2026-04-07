import { test } from 'node:test'
import * as assert from 'node:assert'
import type { Link, PrismaClient } from '../../../../generated/prisma/client'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import { createLinkService } from '../../../link/link.service'
import type { LinkService } from '../../../link/link.types'
import linksRoutes from '../link.routes'

const baseDate = new Date('2026-02-01T00:00:00.000Z')

function linkRow (over: Partial<Link> = {}): Link {
  return {
    id: '1',
    slug: 'x',
    destinationUrl: 'https://x.com',
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

const prismaLinkDefaults: Required<LinkClientMock> = {
  create: async (_args: unknown) => linkRow(),
  update: async (_args: unknown) => linkRow(),
  findUnique: async (_args: unknown) => null,
  findMany: async (_args: unknown) => []
}

function mockPrisma (link: LinkClientMock = {}): PrismaClient {
  return {
    link: { ...prismaLinkDefaults, ...link }
  } as unknown as PrismaClient
}

async function buildWithService (service: LinkService) {
  const app = Fastify()
  await app.register(sensible)
  await app.register(linksRoutes, { prefix: '/links', linkService: service })
  return app
}

test('POST /links 400 when body incomplete', async () => {
  const service = createLinkService(mockPrisma({}))
  const app = await buildWithService(service)
  const res = await app.inject({
    method: 'POST',
    url: '/links',
    payload: { slug: 'only' }
  })
  assert.equal(res.statusCode, 400)
  await app.close()
})

test('POST /links 201 and body', async () => {
  const service = createLinkService(
    mockPrisma({
      create: async (args: unknown) => {
        const d = (args as { data: { slug: string; destinationUrl: string } })
          .data
        return linkRow({
          slug: d.slug,
          destinationUrl: d.destinationUrl
        })
      }
    })
  )
  const app = await buildWithService(service)
  const res = await app.inject({
    method: 'POST',
    url: '/links',
    payload: { slug: 'hi', destination_url: 'https://ok.com' }
  })
  assert.equal(res.statusCode, 201)
  const body = JSON.parse(res.payload)
  assert.equal(body.slug, 'hi')
  assert.equal(body.destination_url, 'https://ok.com')
  await app.close()
})

test('POST /links 409 when slug taken', async () => {
  const service = createLinkService(
    mockPrisma({
      create: async (_args: unknown) => {
        throw Object.assign(new Error('u'), { code: 'P2002' })
      }
    })
  )
  const app = await buildWithService(service)
  const res = await app.inject({
    method: 'POST',
    url: '/links',
    payload: { slug: 'taken', destination_url: 'https://a.com' }
  })
  assert.equal(res.statusCode, 409)
  await app.close()
})

test('GET /links returns links array', async () => {
  const item = linkRow({
    slug: 's',
    destinationUrl: 'https://s.com',
    clickCount: 3
  })
  const service = createLinkService(
    mockPrisma({
      findMany: async (_args: unknown) => [item]
    })
  )
  const app = await buildWithService(service)
  const res = await app.inject({ method: 'GET', url: '/links' })
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload) as Array<{
    destination: string
    click_count: number
  }>
  assert.equal(body.length, 1)
  assert.equal(body[0].destination, 'https://s.com')
  assert.equal(body[0].click_count, 3)
  await app.close()
})

test('GET /links/:slug 404', async () => {
  const service = createLinkService(mockPrisma({}))
  const app = await buildWithService(service)
  const res = await app.inject({ method: 'GET', url: '/links/missing' })
  assert.equal(res.statusCode, 404)
  await app.close()
})

test('PATCH /links/:slug 400 without destination_url', async () => {
  const service = createLinkService(mockPrisma({}))
  const app = await buildWithService(service)
  const res = await app.inject({
    method: 'PATCH',
    url: '/links/x',
    payload: {}
  })
  assert.equal(res.statusCode, 400)
  await app.close()
})

test('PATCH /links/:slug 200', async () => {
  const service = createLinkService(
    mockPrisma({
      update: async (_args: unknown) =>
        linkRow({
          slug: 'x',
          destinationUrl: 'https://new.net'
        })
    })
  )
  const app = await buildWithService(service)
  const res = await app.inject({
    method: 'PATCH',
    url: '/links/x',
    payload: { destination_url: 'https://new.net' }
  })
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.payload)
  assert.equal(body.destination_url, 'https://new.net')
  await app.close()
})
