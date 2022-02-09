import createRequest from './create-request'
import createResponse from '../create-response'
import createRouter from './create-router'
import wrapApiHandler, {
  GetCustomParameters as GetCustomParametersAWSLambdaOriginEdge,
} from './wrap-api-handler'

export const AWSLambdaOriginEdge = {
  createRequest,
  createResponse,
  createRouter,
  wrapApiHandler,
}

export type { GetCustomParametersAWSLambdaOriginEdge }
