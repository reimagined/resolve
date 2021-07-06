import type { DropReadModelMethod } from './types'
import fetch from 'node-fetch'

//eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { RESET_REPLICATION } from '@resolve-js/module-replication'

const dropReadModel: DropReadModelMethod = async (pool, readModelName) => {
  await fetch(`${pool.targetApplicationUrl}${RESET_REPLICATION.endpoint}`, {
    method: RESET_REPLICATION.method,
  })
}

export default dropReadModel
