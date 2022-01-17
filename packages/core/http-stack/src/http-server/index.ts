import createRequest from './create-request'
import createResponse from '../create-response'
import createRouter from './create-router'
import wrapApiHandler, {
  GetCustomParameters as GetCustomParametersHttpServer,
} from './wrap-api-handler'

export const HttpServer = {
  createRequest,
  createResponse,
  createRouter,
  wrapApiHandler,
}

export type { GetCustomParametersHttpServer }
