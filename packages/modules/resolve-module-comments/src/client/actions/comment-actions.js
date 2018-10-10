import { actions } from 'resolve-redux'

import { commandTypes, DEFAULT_AGGREGATE_NAME } from '../../common/constants'

const { sendCommandRequest } = actions

export default ({ aggregateName = DEFAULT_AGGREGATE_NAME } = {}) => {
  const actionCreators = {}

  for (const name of Object.keys(commandTypes)) {
    const commandType = commandTypes[name]
    actionCreators[name] = (aggregateId, payload) =>
      sendCommandRequest(commandType, aggregateId, aggregateName, payload)
  }

  return actionCreators
}
