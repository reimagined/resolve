import React from 'react'
import ReactDOM from 'react-dom/server'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import createHistory from 'history/createMemoryHistory'
import jsonwebtoken from 'jsonwebtoken'

import createStore from '../client/store/create_store'
import getHtmlMarkup from './get_html_markup'
import getClientEnv from './utils/get_client_env'
import Routes from '../client/components/Routes'

const staticPath = $resolve.staticPath // eslint-disable-line
const jwtCookieName = $resolve.jwtCookie.name // eslint-disable-line
const routes = require($resolve.routes) // eslint-disable-line

const serverSideRendering = (req, res) => {
  const url = req.params[0] || ''

  const history = createHistory()

  history.push(url)

  const jwt = {}
  try {
    Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookieName]))
  } catch (e) {}

  const store = createStore(
    {
      jwt
    },
    history
  )

  const markup = ReactDOM.renderToStaticMarkup(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Routes routes={routes} />
      </ConnectedRouter>
    </Provider>
  )

  const env = getClientEnv()
  const initialState = store.getState()
  const clientUrl = `${staticPath}/client.js`

  res.send(
    getHtmlMarkup({
      env,
      initialState,
      markup,
      clientUrl
    })
  )
}

export default serverSideRendering
