import * as actions from './actions'

const sendAggregateAction = (
  aggregateName: string,
  commandType: string,
  aggregateId: string,
  payload: any
) => {
  return actions.sendCommandRequest(
    commandType,
    aggregateId,
    aggregateName,
    payload
  )
}

export default sendAggregateAction
