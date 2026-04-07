import '../../types/fastify-prisma'
import { createLinkService } from '../../link/link.service'
import type { LinkService } from '../../link/link.types'
import { type FastifyPluginAsync } from 'fastify'

export type RedirectRoutesOpts = {
  linkService?: LinkService
}

const redirectRoutes: FastifyPluginAsync<RedirectRoutesOpts> = async (
  fastify,
  opts
) => {
  const service =
    opts.linkService ?? createLinkService(fastify.prisma)

  fastify.get<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
    const target = await service.getRedirectBySlug(request.params.slug)
    if (!target) {
      return reply.status(404).send({ error: 'link not found' })
    }

    const ip_address = request.ip
    const user_agent = request.headers['user-agent'] ?? ''

    void service
      .recordClick(target.id, { ip_address, user_agent })
      .catch((err: unknown) => {
        request.log.error({ err }, 'async click record failed')
      })

    return reply.redirect(target.destination_url, 302)
  })
}

export default redirectRoutes
