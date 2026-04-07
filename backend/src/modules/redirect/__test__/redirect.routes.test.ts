import { test } from 'node:test'
import * as assert from 'node:assert'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import type { RecordClickInput, RedirectService } from '../redirect.types'
import redirectRoutes from '../redirect.routes'

function stubRedirectService (partial: Partial<RedirectService>): RedirectService {
  return {
    getRedirectBySlug: async () => null,
    recordClick: async () => {},
    ...partial
  }
}

async function build (service: RedirectService) {
  const app = Fastify()
  await app.register(sensible)
  await app.register(redirectRoutes, { redirectService: service })
  return app
}

test('GET /:slug 404 when link missing', async () => {
  let clicks = 0
  const app = await build(
    stubRedirectService({
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

test('GET /:slug 302 redirects to destinationUrl', async () => {
  const app = await build(
    stubRedirectService({
      getRedirectBySlug: async (slug) => {
        assert.equal(slug, 'go')
        return { id: 'id-1', destinationUrl: 'https://example.com/path' }
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
    stubRedirectService({
      getRedirectBySlug: async () => ({
        id: 'id-1',
        destinationUrl: 'https://fast.example'
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

test('GET /:slug passes ip and userAgent to recordClick', async () => {
  let captured: RecordClickInput | undefined
  const app = await build(
    stubRedirectService({
      getRedirectBySlug: async () => ({
        id: 'link-id',
        destinationUrl: 'https://track.example'
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
  assert.equal(captured.userAgent, 'MyBot/1.0')
  assert.equal(typeof captured.ipAddress, 'string')
  assert.ok(captured.ipAddress.length > 0)
  await app.close()
})
