import createQueryExecutor from 'resolve-query'

import eventStore from './event_store'
import snapshotAdapter from './snapshot_adapter'

import { viewModels, readModels } from './assemblies'

const queryExecutor = createQueryExecutor({
  eventStore,
  viewModels,
  readModels,
  snapshotAdapter
})

export default queryExecutor
