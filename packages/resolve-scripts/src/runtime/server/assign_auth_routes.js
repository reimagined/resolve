import {
  createAuthOptions,
  createRequest,
  createResponse,
  resolveAuth
} from 'resolve-auth'

import applyJwtValue from './utils/apply_jwt_value'
import getRootableUrl from './utils/get_rootable_url'
import readModelQueryExecutors from './read_model_query_executors'
import viewModelQueryExecutors from './view_model_query_executors'
import executeCommand from './command_executor'

const authStrategiesConfigs = require($resolve.auth.strategies)
const authStrategies = authStrategiesConfigs.map(({ strategy, options }) =>
  resolveAuth(strategy, options)
)

const assignAuthRoutes = app => {
  authStrategies.forEach(strategy => {
    strategy.forEach(({ route, callback }) => {
      app[route.method.toLowerCase()](
        getRootableUrl(route.path),
        (req, res, next) => {
          const safeReq = createRequest(req)
          Object.assign(safeReq, {
            readModelQueryExecutors,
            viewModelQueryExecutors,
            executeCommand
          })
          const safeRes = {
            applyJwtValue,
            ...createResponse(res)
          }
          callback(safeReq, safeRes, createAuthOptions(safeReq, safeRes, next))
        }
      )
    })
  })
}

export default assignAuthRoutes
