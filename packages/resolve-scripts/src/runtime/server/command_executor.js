import createCommandExecutor from 'resolve-command'
import eventStore from './event_store'

import aggregates from '$resolve.aggregates'

const commandExecutor = createCommandExecutor({
  eventStore,
  aggregates: aggregates.map(({ snapshotAdapter, ...aggregate }) => {
    if (!snapshotAdapter) {
      return aggregate
    }

    return {
      ...aggregate,
      snapshotAdapter: snapshotAdapter.module(snapshotAdapter.options),
      snapshotBucketSize: snapshotAdapter.options.bucketSize
    }
  })
})

export default commandExecutor
