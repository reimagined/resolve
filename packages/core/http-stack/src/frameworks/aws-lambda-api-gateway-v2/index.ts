import isValidRequest from './is-valid-request'
import createRequest from './create-request'
import createResponse from '../../create-response'
import createRouter from './create-router'
import wrapApiHandler, {
  GetCustomParameters as FrameworkAWSLambdaApiGatewayV2GetCustomParameters,
} from './wrap-api-handler'

export const FrameworkAWSLambdaApiGatewayV2 = {
  isValidRequest,
  createRequest,
  createResponse,
  createRouter,
  wrapApiHandler,
}

export type { FrameworkAWSLambdaApiGatewayV2GetCustomParameters }
