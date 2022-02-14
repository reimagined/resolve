import createRequest from './create-request'
import createResponse from '../../create-response'
import createRouter from './create-router'
import wrapApiHandler, {
  GetCustomParameters as FrameworkHttpServerGetCustomParameters,
} from './wrap-api-handler'

export const FrameworkHttpServer = {
  createRequest,
  createResponse,
  createRouter,
  wrapApiHandler,
}

export type { FrameworkHttpServerGetCustomParameters }
