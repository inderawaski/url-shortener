import { createLinkService } from './links.service'
import type { LinkRoutesOpts } from './links.types'
import { type FastifyPluginAsync, type FastifyReply } from 'fastify'

const linkRoutes: FastifyPluginAsync<LinkRoutesOpts> = async (
  fastify,
  opts
) => {
  const service =
    opts.linkService ?? createLinkService(fastify.prisma)

  function sendError (
    reply: FastifyReply,
    status: number,
    message: string
  ): void {
    void reply.status(status).send({ error: message })
  }

  fastify.post<{
    Body: { slug?: string; destination_url?: string }
  }>('/links', async (request, reply) => {
    const { slug, destination_url } = request.body ?? {}
    if (slug === undefined || destination_url === undefined) {
      return sendError(reply, 400, 'slug and destinationUrl are required')
    }

    const result = await service.createLink({ slug, destinationUrl: destination_url })
    if ('code' in result) {
      if (result.code === 'INVALID_SLUG') {
        return sendError(
          reply,
          400,
          'slug must match pattern ^[a-zA-Z0-9-_]+$'
        )
      }
      if (result.code === 'INVALID_DESTINATION_URL') {
        return sendError(
          reply,
          400,
          'destinationUrl must be a valid http(s) URL'
        )
      }
      if (result.code === 'SLUG_TAKEN') {
        return sendError(reply, 409, 'slug is already in use')
      }
    }
    return reply.status(201).send(result)
  })

  fastify.get('/links', async (_request, reply) => {
    const items = await service.listLinks()
    return reply.send(items)
  })

  fastify.get<{ Params: { slug: string } }>('/links/:slug', async (request, reply) => {
    const result = await service.getLinkDetails(request.params.slug)
    if ('code' in result) {
      if (result.code === 'INVALID_SLUG') {
        return sendError(
          reply,
          400,
          'slug must match pattern ^[a-zA-Z0-9-_]+$'
        )
      }
      if (result.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'link not found')
      }
    }
    return reply.send(result)
  })

  fastify.patch<{
    Params: { slug: string }
    Body: { destination_url?: string }
  }>('/links/:slug', async (request, reply) => {
    const destination_url = request.body?.destination_url
    if (destination_url === undefined) {
      return sendError(reply, 400, 'destinationUrl is required')
    }

    const result = await service.updateLink(request.params.slug, {
      destinationUrl: destination_url
    })
    if ('code' in result) {
      if (result.code === 'INVALID_SLUG') {
        return sendError(
          reply,
          400,
          'slug must match pattern ^[a-zA-Z0-9-_]+$'
        )
      }
      if (result.code === 'INVALID_DESTINATION_URL') {
        return sendError(
          reply,
          400,
          'destinationUrl must be a valid http(s) URL'
        )
      }
      if (result.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'link not found')
      }
    }
    return reply.send(result)
  })

  fastify.delete<{ Params: { slug: string } }>('/links/:slug', async (request, reply) => {
    const result = await service.deleteLink(request.params.slug)
    if ('code' in result) {
      if (result.code === 'INVALID_SLUG') {
        return sendError(
          reply,
          400,
          'slug must match pattern ^[a-zA-Z0-9-_]+$'
        )
      }
      if (result.code === 'NOT_FOUND') {
        return sendError(reply, 404, 'link not found')
      }
    }
    return reply.send(result)
  })
}

export default linkRoutes
