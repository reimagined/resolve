import type { DropReadModelMethod } from './types'
import fetch from 'node-fetch'
import HttpError from './http-error'

import { RESET_REPLICATION } from '@resolve-js/module-replication'

const dropReadModel: DropReadModelMethod = async (pool, readModelName) => {
  const response = await fetch(
    `${pool.targetApplicationUrl}${RESET_REPLICATION.endpoint}`,
    {
      method: RESET_REPLICATION.method,
    }
  )
  if (!response.ok) {
    throw new HttpError(await response.text(), response.status)
  }
}

export default dropReadModel
