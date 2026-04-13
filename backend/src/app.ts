import 'dotenv/config'
import { join } from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify'
import linksRoutes from './modules/links/links.routes'
import redirectRoutes from './modules/redirect/redirect.routes'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts: AppOptions
): Promise<void> => {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  // Register routes explicitly so public redirects and internal API
  // are always mounted at predictable paths.
  void fastify.register(linksRoutes)
  void fastify.register(redirectRoutes)

}

export default app
export { app, options }
