import type { DropReadModelMethod } from './types'
import fetch from 'node-fetch'

const dropReadModel: DropReadModelMethod = async (pool, readModelName) => {
  await fetch(`${pool.targetApplicationUrl}/api/reset-replication`, {
    method: 'POST',
  })
}

export default dropReadModel
