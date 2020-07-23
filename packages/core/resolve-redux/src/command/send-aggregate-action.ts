import { sendCommandRequest, SendCommandRequestAction } from './actions'

const sendAggregateAction = (
  aggregateName: string,
  commandType: string,
  aggregateId: string,
  payload: any
): SendCommandRequestAction =>
  sendCommandRequest(commandType, aggregateId, aggregateName, payload)

export { sendAggregateAction }
