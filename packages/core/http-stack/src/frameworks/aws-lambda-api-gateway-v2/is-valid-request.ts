import { LambdaApiGatewayV2Request } from '../../types'

const isValidRequest = (event: any): event is LambdaApiGatewayV2Request =>
  event != null &&
  event.version === '2.0' &&
  event.routeKey?.constructor === String &&
  event.rawPath?.constructor === String

export default isValidRequest
