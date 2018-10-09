import { actions } from 'resolve-redux'

import { commandTypes, defaultAggregateName } from '../../common/constants'

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
