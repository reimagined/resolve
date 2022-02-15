import isValidRequest from './is-valid-request'
import createRequest from './create-request'
import createResponse from '../../create-response'
import createRouter from './create-router'
import wrapApiHandler, {
  GetCustomParameters as FrameworkAWSLambdaOriginEdgeGetCustomParameters,
} from './wrap-api-handler'

export const FrameworkAWSLambdaOriginEdge = {
  isValidRequest,
  createRequest,
  createResponse,
  createRouter,
  wrapApiHandler,
}

export type { FrameworkAWSLambdaOriginEdgeGetCustomParameters }
