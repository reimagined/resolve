import React from 'react'
import ReactDOM from 'react-dom/server'
import { createStore, AppContainer } from 'resolve-redux'
import { Helmet } from 'react-helmet'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'

import UploaderContext from './context'
import App from './containers/App'
import Layout from './components/Layout'

const ssrHandler = async (
  { localS3Constants, constants, seedClientEnvs, viewModels, utils },
  req,
  res
) => {
  try {
    const { getRootBasedUrl, getStaticBasedPath, jsonUtfStringify } = utils
    const { rootPath, staticPath, jwtCookie } = constants

    const baseQueryUrl = getRootBasedUrl(rootPath, '/')
    const origin = ''
    const url = req.path.substring(baseQueryUrl.length)
    const history = createMemoryHistory()
    history.push(url)

    const jwt = {}
    try {
      Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookie.name]))
    } catch (e) {}

    const store = createStore({
      initialState: { jwt },
      viewModels,
      subscribeAdapter: {},
      history,
      origin,
      rootPath,
      isClient: false
    })

    const markup = ReactDOM.renderToStaticMarkup(
      <AppContainer
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        store={store}
      >
        <Layout staticPath={staticPath}>
          <UploaderContext.Provider value={localS3Constants}>
            <App store={store} />
          </UploaderContext.Provider>
        </Layout>
      </AppContainer>
    )

    const initialState = store.getState()
    const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'index.js')
    const faviconUrl = getStaticBasedPath(rootPath, staticPath, 'favicon.ico')

    const helmet = Helmet.renderStatic()

    const markupHtml =
      `<!doctype html>` +
      `<html ${helmet.htmlAttributes.toString()}>` +
      '<head>' +
      `<link rel="icon" type="image/x-icon" href="${faviconUrl}" />` +
      `${helmet.title.toString()}` +
      `${helmet.meta.toString()}` +
      `${helmet.link.toString()}` +
      `${helmet.style.toString()}` +
      '<script>' +
      `window.__INITIAL_STATE__=${jsonUtfStringify(initialState)};` +
      `window.__RESOLVE_RUNTIME_ENV__=${jsonUtfStringify(seedClientEnvs)};` +
      '</script>' +
      `${helmet.script.toString()}` +
      '</head>' +
      `<body ${helmet.bodyAttributes.toString()}>` +
      `<div id="app-container">${markup}</div>` +
      `<script src="${bundleUrl}"></script>` +
      '</body>' +
      '</html>'

    await res.setHeader('Content-Type', 'text/html')

    await res.end(markupHtml)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('SSR error', error)
    res.status(500)
    res.end('SSR error')
  }
}

export default ssrHandler
