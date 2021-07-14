import { InternalMethods } from './types'
import fetch from 'node-fetch'

//eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as REPLICATION_CONSTANTS from '@resolve-js/module-replication'
const { PAUSE_REPLICATION, RESUME_REPLICATION } = REPLICATION_CONSTANTS

const setReplicationPaused: InternalMethods['setReplicationPaused'] = async (
  pool,
  paused
) => {
  if (paused) {
    await fetch(`${pool.targetApplicationUrl}${PAUSE_REPLICATION.endpoint}`, {
      method: PAUSE_REPLICATION.method,
    })
  } else {
    await fetch(`${pool.targetApplicationUrl}${RESUME_REPLICATION.endpoint}`, {
      method: RESUME_REPLICATION.method,
    })
  }
}

export default setReplicationPaused
