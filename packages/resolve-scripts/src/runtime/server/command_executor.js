import createCommandExecutor from 'resolve-command'
import eventStore from './event_store'

import aggregates from '$resolve.aggregates'

const commandExecutor = createCommandExecutor({
  eventStore,
  aggregates
})

export default commandExecutor
