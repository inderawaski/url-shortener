import { createRedirectService } from './redirect.service'
import type { RedirectRoutesOpts } from './redirect.types'
import { type FastifyPluginAsync } from 'fastify'

const redirectRoutes: FastifyPluginAsync<RedirectRoutesOpts> = async (
  fastify,
  opts
) => {
  const service =
    opts.redirectService ?? createRedirectService(fastify.prisma)

  fastify.get<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
    const target = await service.getRedirectBySlug(request.params.slug)
    if (!target) {
      return reply.status(404).send({ error: 'link not found' })
    }

    const ipAddress = request.ip
    const userAgent = request.headers['user-agent'] ?? ''

    void service
      .recordClick(target.id, { ipAddress, userAgent })
      .catch((err: unknown) => {
        request.log.error({ err }, 'async click record failed')
      })

    return reply.redirect(target.destinationUrl, 302)
  })
}

export default redirectRoutes
