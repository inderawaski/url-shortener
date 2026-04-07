// Shared helpers for integration-style tests (e.g. fastify-cli app build).
import * as path from 'node:path'
import * as test from 'node:test'
const helper = require('fastify-cli/helper.js')

export type TestContext = {
  after: typeof test.after
}

const AppPath = path.join(__dirname, '..', 'app.ts')

function config () {
  return {
    skipOverride: true
  }
}

async function build (t: TestContext) {
  const argv = [AppPath]
  const app = await helper.build(argv, config())
  // eslint-disable-next-line no-void
  t.after(() => void app.close())
  return app
}

export {
  config,
  build
}
