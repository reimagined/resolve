import createCommandExecutor from 'resolve-command'

import eventStore from './event_store'
import snapshotAdapter from './snapshot_adapter'

import { aggregates } from './assemblies'

const commandExecutor = createCommandExecutor({
  eventStore,
  aggregates,
  snapshotAdapter
})

export default commandExecutor
