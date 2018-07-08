import Url from 'url'
import React from 'react'
import ReactDOM from 'react-dom/server'
import createHistory from 'history/createMemoryHistory'
import jsonwebtoken from 'jsonwebtoken'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

import createStore from '../client/store/create_store'
import getHtmlMarkup from './get_html_markup'
import getRootBasedUrl from './utils/get_root_based_url'
import AppContainer from '../client/components/AppContainer'

import routes from '$resolve.routes'
import staticPath from '$resolve.staticPath'
import rootPath from '$resolve.rootPath'
import jwtCookie from '$resolve.jwtCookie'
import aggregateActions from '$resolve.aggregateActions'

const serverSideRendering = (req, res) => {
  const url = req.params[0] || ''

  const history = createHistory()

  history.push(url)

  const jwt = {}
  try {
    Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookie.name]))
  } catch (e) {}

  const store = createStore({
    initialState: {
      jwt
    },
    history,
    origin: req.headers.origin,
    rootPath,
    isClient: false
  })

  const sheet = new ServerStyleSheet()
  const markup = ReactDOM.renderToStaticMarkup(
    <StyleSheetManager sheet={sheet.instance}>
      <AppContainer
        aggregateActions={aggregateActions}
        store={store}
        history={history}
        routes={routes}
      />
    </StyleSheetManager>
  )
  const styleTags = sheet.getStyleTags()

  const initialState = store.getState()
  const clientUrl = getRootBasedUrl(Url.resolve(staticPath || '/', 'client.js'))

  res.send(
    getHtmlMarkup({
      markup,
      styleTags,
      initialState,
      clientUrl
    })
  )
}

export default serverSideRendering
