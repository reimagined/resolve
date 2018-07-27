import { resolveAuth } from 'resolve-auth'
import getRootBasedUrl from './utils/get_root_based_url'
import executeViewModelQuery from './execute_view_model_query'
import executeReadModelQuery from './execute_read_model_query'
import executeCommand from './command_executor'

import auth from '$resolve.auth'

const authStrategiesConfigs = auth.strategies

const authStrategies = authStrategiesConfigs.map(
  ({ strategyConstructor, options }) =>
    resolveAuth(strategyConstructor, options)
)

const assignAuthRoutes = app => {
  authStrategies.forEach(({ route, callback }) => {
    app[route.method.toLowerCase()](
      getRootBasedUrl(route.path),
      (req, res, next) => {
        Object.assign(req, {
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
        callback(req, res, next)
      }
    )
  })
}

export default assignAuthRoutes
