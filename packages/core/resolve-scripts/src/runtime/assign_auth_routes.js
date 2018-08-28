import createStrategy from 'resolve-auth'
import getRootBasedUrl from './utils/get_root_based_url'
import executeViewModelQuery from './execute_view_model_query'
import executeReadModelQuery from './execute_read_model_query'
import executeCommand from './command_executor'

import { auth, rootPath, jwtCookie } from './assemblies'

const strategies = auth.strategies.map(
  ({ strategyConstructor, options }) =>
    createStrategy(strategyConstructor, options, { rootPath, jwtCookie, getRootBasedUrl })
)

const assignAuthRoutes = app => {
  strategies.forEach(
    ({ route, callback }) => {
    app[route.method.toLowerCase()](
      getRootBasedUrl(rootPath, route.path),
      async (req, res) => {
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
        
        console.log('const authResponse = await callback(req)')
        
        const authResponse = await callback(req)
  
        console.log(authResponse)
  
        res.statusCode = authResponse.statusCode
  
        for(const key of Object.keys(authResponse.headers)) {
          res.setHeader(key, authResponse.headers[key])
        }
        for(const key of Object.keys(authResponse.cookies)) {
          res.cookie(key, authResponse.cookies[key].value, authResponse.cookies[key].options)
        }
  
        res.end(authResponse.error)
      }
    )
  })
}

export default assignAuthRoutes
