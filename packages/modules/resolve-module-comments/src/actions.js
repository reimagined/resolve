import { actions } from 'resolve-redux'

import * as commandTypes from './command_types'
import defaultAggregateName from './defaults/aggregate_name'

const { sendCommandRequest } = actions

export default ({ aggregateName = defaultAggregateName } = {}) => {
  const actionCreators = {}

  for (const name of Object.keys(commandTypes)) {
    const commandType = commandTypes[name]
    actionCreators[name] = (aggregateId, payload) =>
      sendCommandRequest(commandType, aggregateId, aggregateName, payload)
  }

  return actionCreators
}
