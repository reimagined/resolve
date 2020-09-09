import { sendCommandRequest, SendCommandRequestAction } from './actions'

const sendAggregateAction = (
  aggregateName: string,
  commandType: string,
  aggregateId: string,
  payload: any
): SendCommandRequestAction =>
  sendCommandRequest(
    {
      type: commandType,
      aggregateName,
      aggregateId,
      payload,
    },
    false
  )

export { sendAggregateAction }
