import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'
import '../types/fastify-prisma'
import fp from 'fastify-plugin'
import pg from 'pg'

export default fp(
  async (fastify) => {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }

    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    fastify.decorate('prisma', prisma)

    fastify.addHook('onClose', async (instance) => {
      await instance.prisma.$disconnect()
      await pool.end()
    })
  },
  { name: 'prisma-plugin' }
)

