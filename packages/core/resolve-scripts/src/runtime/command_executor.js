import createCommandExecutor from 'resolve-command'
import eventStore from './event_store'

import { aggregates } from './assemblies'

const commandExecutor = createCommandExecutor({
  eventStore,
  aggregates: aggregates.map(({ snapshotAdapter, ...aggregate }) => {
    if (!snapshotAdapter) {
      return aggregate
    }

    return {
      ...aggregate,
      snapshotAdapter
    }
  })
})

export default commandExecutor
