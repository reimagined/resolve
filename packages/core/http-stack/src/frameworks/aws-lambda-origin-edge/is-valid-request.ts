import { LambdaOriginEdgeRequest } from '../../types'

const isValidRequest = (event: any): event is LambdaOriginEdgeRequest =>
  event != null &&
  event.httpMethod?.constructor === String &&
  Array.isArray(event.headers) &&
  (event.querystring == null || event?.querystring?.constructor === String) &&
  event.uri?.constructor === String &&
  (event.body == null || event.body?.constructor === String) &&
  event.requestStartTime?.constructor === Number

export default isValidRequest
