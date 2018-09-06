import createQueryExecutor from 'resolve-query'

import eventStore from './event_store'
import { viewModels, readModels } from './assemblies'

const queryExecutor = createQueryExecutor({
  eventStore,
  viewModels,
  readModels
})

export default queryExecutor
