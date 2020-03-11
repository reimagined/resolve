/*
import React from 'react'
import { render } from 'react-dom'
import { createBrowserHistory } from 'history'
import { AppContainer, createStore, getOrigin } from 'resolve-redux'

import optimisticShoppingListsSaga from './sagas/optimistic_shopping_lists_saga'
import optimisticShoppingListsReducer from './reducers/optimistic_shopping_lists'
import routes from './routes'

const entryPoint = ({ rootPath, staticPath, viewModels, subscribeAdapter }) => {
  const origin = getOrigin(window.location)
  const history = createBrowserHistory({ basename: rootPath })
  const redux = {
    reducers: { optimisticShoppingLists: optimisticShoppingListsReducer },
    sagas: [optimisticShoppingListsSaga]
  }

  const store = createStore({
    redux,
    viewModels,
    subscribeAdapter,
    history,
    origin,
    rootPath,
    isClient: true
  })

  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)

  render(
    <AppContainer
      origin={origin}
      rootPath={rootPath}
      staticPath={staticPath}
      store={store}
      history={history}
      routes={routes}
    />,
    appContainer
  )
}

export default entryPoint
*/

import React from 'react'
import { render } from 'react-dom'
import { ResolveContext } from 'resolve-react-hooks'
// import { createBrowserHistory } from 'history'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import routes from './routes'

// import App from './containers/App'

/* const RouteConfig = () => (
  <Router>
    <div>
      <ul>
        <li>
          <Link to="/tacos">Tacos</Link>
        </li>
        <li>
          <Link to="/sandwiches">Sandwiches</Link>
        </li>
      </ul>
      <Switch>
        {routes.map((route, i) => (
          <Route
            key={i}
            path={route.path}
            render={props => (
              // pass the sub-routes down to keep nesting
              <route.component {...props} routes={route.routes} />
            )}
          />
        ))}
      </Switch>
    </div>
  </Router>
)
 */

const entryPoint = context => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  // const { rootPath } = context
  // const history = createBrowserHistory({ basename: rootPath })
  render(
    <ResolveContext.Provider value={context}>
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveContext.Provider>,
    appContainer
  )
}

export default entryPoint
