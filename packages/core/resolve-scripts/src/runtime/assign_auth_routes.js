import resolveAuth from 'resolve-auth'
import getRootBasedUrl from './utils/get_root_based_url'
import executeViewModelQuery from './execute_view_model_query'
import executeReadModelQuery from './execute_read_model_query'
import executeCommand from './command_executor'

import { auth, rootPath, jwtCookie } from './assemblies'

const authStrategiesConfigs = auth.strategies

const authStrategies = authStrategiesConfigs.map(
  ({ strategyConstructor, options }) =>
    resolveAuth(strategyConstructor, options, { rootPath, jwtCookie })
)

const postProcessResponse = (resExpress, response) => {
  resExpress.statusCode = response.statusCode
  const headers = response.headers || {}
  const cookies = response.cookies || {}
  Object.keys(headers).forEach(key => {
    resExpress.setHeader(key, headers[key])
  })
  Object.keys(cookies).forEach(key => {
    resExpress.cookie(key, cookies[key].value, cookies[key].options)
  })
  const jwtToken = cookies[jwtCookie.name]
  if (jwtToken) {
    resExpress.setHeader('Authorization', `Bearer ${jwtToken}`)
  }

  resExpress.end(response.error)
}

const assignAuthRoutes = app => {
  authStrategies.forEach(({ route, callback }) => {
    app[route.method.toLowerCase()](
      getRootBasedUrl(rootPath, route.path),
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
