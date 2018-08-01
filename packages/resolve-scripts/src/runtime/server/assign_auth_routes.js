import resolveAuth from 'resolve-auth'
import getRootBasedUrl from './utils/get_root_based_url'
import executeViewModelQuery from './execute_view_model_query'
import executeReadModelQuery from './execute_read_model_query'
import executeCommand from './command_executor'

import auth from '$resolve.auth'
import rootPath from '$resolve.rootPath'
import jwtCookie from '$resolve.jwtCookie'

const authStrategiesConfigs = auth.strategies

const authStrategies = authStrategiesConfigs.map(
  ({ strategyConstructor, options }) =>
    resolveAuth(strategyConstructor, options, { rootPath, jwtCookie })
)

const postProcessResponse = (resExpress, response) => {
  resExpress.statusCode = response.statusCode
  Object.keys(response.headers || {}).forEach(key => {
    resExpress.setHeader(key, response.headers[key])
  })
  Object.keys(response.cookies || {}).forEach(key => {
    resExpress.cookie(
      key,
      response.cookies[key].value,
      response.cookies[key].options
    )
  })

  resExpress.end(response.error)
}

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
        callback(req, res, next).then(authResponse => {
          postProcessResponse(res, authResponse)
        })
      }
    )
  })
}

export default assignAuthRoutes
