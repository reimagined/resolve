import path from 'path'

import createAggregates from './aggregates'
import createReadModels from './read-models'
import * as commandTypes from './command_types'
import * as eventTypes from './event_types'
import createActions from './actions'
import defaultAggregateName from './defaults/aggregate_name'

export default ({
  aggregateName = defaultAggregateName,
  verify = path.join(__dirname, './defaults/verify.js')
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
