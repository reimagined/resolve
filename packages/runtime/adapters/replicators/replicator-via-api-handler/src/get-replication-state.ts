import { InternalMethods } from './types'
import { ReplicationState } from '@resolve-js/eventstore-base'
import fetch from 'node-fetch'

const getReplicationState: InternalMethods['getReplicationState'] = async (
  pool
) => {
  const response = await fetch(
    `${pool.targetApplicationUrl}/api/replication-state`
  )
  const state: ReplicationState = await response.json()
  return state
}

export default getReplicationState
