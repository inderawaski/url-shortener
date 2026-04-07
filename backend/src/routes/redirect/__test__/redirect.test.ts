import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import type { LinkService, RecordClickInput } from '../../../link/link.types'
import redirectRoutes from '../redirect.routes'

function stubLinkService (partial: Partial<LinkService>): LinkService {
  return {
    createLink: async () => ({ code: 'INVALID_SLUG' }),
    updateLink: async () => ({ code: 'NOT_FOUND' }),
    listLinks: async () => [],
    getLinkDetails: async () => ({ code: 'NOT_FOUND' }),
    getRedirectBySlug: async () => null,
    recordClick: async () => {},
    ...partial
  }
}

async function build (service: LinkService) {
  const app = Fastify()
  await app.register(sensible)
  await app.register(redirectRoutes, { linkService: service })
  return app
}

test('GET /:slug 404 when link missing', async () => {
  let clicks = 0
  const app = await build(
    stubLinkService({
      getRedirectBySlug: async () => null,
      recordClick: async () => {
        clicks += 1
      }
    })
  )
  const res = await app.inject({ method: 'GET', url: '/nope' })
  assert.equal(res.statusCode, 404)
  assert.equal(clicks, 0)
  await app.close()
})

test('GET /:slug 302 redirects to destination_url', async () => {
  const app = await build(
    stubLinkService({
      getRedirectBySlug: async (slug) => {
        assert.equal(slug, 'go')
        return { id: 'id-1', destination_url: 'https://example.com/path' }
      },
      recordClick: async () => {}
    })
  )
  const res = await app.inject({
    method: 'GET',
    url: '/go',
    headers: { 'user-agent': 'test-ua' }
  })
  assert.equal(res.statusCode, 302)
  assert.equal(res.headers.location, 'https://example.com/path')
  await app.close()
})

test('GET /:slug responds before recordClick finishes', async () => {
  const app = await build(
    stubLinkService({
      getRedirectBySlug: async () => ({
        id: 'id-1',
        destination_url: 'https://fast.example'
      }),
      recordClick: async () => {
        await new Promise<void>(() => {
          /* intentionally never resolves */
        })
      }
    })
  )
  const res = await app.inject({ method: 'GET', url: '/x' })
  assert.equal(res.statusCode, 302)
  await app.close()
})

test('GET /:slug passes ip and user-agent to recordClick', async () => {
  let captured: RecordClickInput | undefined
  const app = await build(
    stubLinkService({
      getRedirectBySlug: async () => ({
        id: 'link-id',
        destination_url: 'https://track.example'
      }),
      recordClick: async (_linkId, meta) => {
        captured = meta
      }
    })
  )
  const res = await app.inject({
    method: 'GET',
    url: '/t',
    headers: { 'user-agent': 'MyBot/1.0' }
  })
  assert.equal(res.statusCode, 302)
  await new Promise<void>(r => setImmediate(r))
  assert.ok(captured !== undefined)
  assert.equal(captured.user_agent, 'MyBot/1.0')
  assert.equal(typeof captured.ip_address, 'string')
  assert.ok(captured.ip_address.length > 0)
  await app.close()
})
