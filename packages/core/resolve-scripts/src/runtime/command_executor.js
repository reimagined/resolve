import createCommandExecutor from 'resolve-command'
import eventStore from './event_store'

import { aggregates } from './assemblies'

const commandExecutor = createCommandExecutor({
  eventStore,
  aggregates: aggregates.map(
    ({ snapshotAdapter: createSnapshotAdapter, ...aggregate }) => {
      if (!createSnapshotAdapter) {
        return aggregate
      }

      return {
        ...aggregate,
        snapshotAdapter: createSnapshotAdapter()
      }
    }
  )
})

export default commandExecutor
