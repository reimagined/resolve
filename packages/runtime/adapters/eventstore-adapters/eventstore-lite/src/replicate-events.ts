import { AdapterPool } from './types'
import { OldEvent } from '@resolve-js/eventstore-base'

import initReplicationStateTable from './init-replication-state-table'

export const replicateEvents = async (
  pool: AdapterPool,
  events: OldEvent[]
): Promise<void> => {
  await initReplicationStateTable(pool)
}

export default replicateEvents
