import createRequest from './create-request'
import createResponse from '../create-response'
import createRouter from './create-router'
import wrapApiHandler, {
  GetCustomParameters as GetCustomParametersAWSLambdaApiGatewayV2,
} from './wrap-api-handler'

export const AWSLambdaApiGatewayV2 = {
  createRequest,
  createResponse,
  createRouter,
  wrapApiHandler,
}

export type { GetCustomParametersAWSLambdaApiGatewayV2 }
