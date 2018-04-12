import createCommandExecutor from 'resolve-command'
import eventStore from './event_store'

const aggregates = require($resolve.aggregates)

const commandExecutor = createCommandExecutor({
  eventStore,
  aggregates
})

export default commandExecutor
