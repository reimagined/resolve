import path from 'path'

import createAggregates from './common/aggregates'
import createReadModels from './common/read-models'
import createActions from './client/actions'
import * as commandTypes from './command-types'
import * as eventTypes from './event-types'
import defaultAggregateName from './common/aggregates/defaults/aggregate-name'

export default ({
  aggregateName = defaultAggregateName,
  verify = path.join(
    __dirname,
    './common/aggregates/defaults/verify-command.js'
  )
} = {}) => {
  const options = {
    aggregateName
  }
  const imports = {
    verify
  }

  return {
    aggregates: createAggregates(options, imports),
    readModels: createReadModels(options, imports)
  }
}

export {
  createAggregates,
  createReadModels,
  createActions,
  commandTypes,
  eventTypes
}
