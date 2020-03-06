import * as actions from './actions'

const sendAggregateAction = (
  aggregateName,
  commandType,
  aggregateId,
  payload
) => {
  return actions.sendCommandRequest(
    commandType,
    aggregateId,
    aggregateName,
    payload
  )
}

export default sendAggregateAction
