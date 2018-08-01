import {
  createAuthOptions,
  createRequest,
  createResponse,
  resolveAuth
} from 'resolve-auth'

import applyJwtValue from './utils/apply_jwt_value'
import getRootBasedUrl from './utils/get_root_based_url'
import executeViewModelQuery from './execute_view_model_query'
import executeReadModelQuery from './execute_read_model_query'
import executeCommand from './command_executor'

import { auth, rootPath, jwtCookie } from './assemblies'

const authStrategiesConfigs = auth.strategies

const authStrategies = authStrategiesConfigs.map(
  ({ strategyConstructor, options }) =>
    resolveAuth(strategyConstructor, options)
)

const assignAuthRoutes = app => {
  authStrategies.forEach(({ route, callback }) => {
    app[route.method.toLowerCase()](
      getRootBasedUrl(rootPath, route.path),
      (req, res, next) => {
        const safeReq = createRequest(req)

        Object.assign(safeReq, {
          resolve: {
            executeReadModelQuery: args =>
              executeReadModelQuery({
                ...args,
                jwtToken: req.jwtToken
              }),
            executeViewModelQuery: args =>
              executeViewModelQuery({
                ...args,
                jwtToken: req.jwtToken
              }),
            executeCommand
          }
        })
        const safeRes = {
          applyJwtValue: applyJwtValue.bind(null, rootPath, jwtCookie),
          ...createResponse(res)
        }
        callback(
          safeReq,
          safeRes,
          createAuthOptions(
            getRootBasedUrl.bind(null, rootPath),
            safeReq,
            safeRes,
            next
          )
        )
      }
    )
  })
}

export default assignAuthRoutes
