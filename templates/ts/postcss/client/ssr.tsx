import React from 'react'
import ReactDOM from 'react-dom/server'
import { createMemoryHistory } from 'history'
import { ResolveProvider } from '@resolve-js/react-hooks'
import { Helmet } from 'react-helmet'

import { getRoutes } from './get-routes'
import { StaticRouter } from 'react-router'
import { renderRoutes } from 'react-router-config'

const ssrHandler = async (serverContext, req, res) => {
  try {
    const { seedClientEnvs, constants, viewModels, utils } = serverContext
    const { rootPath, staticPath } = constants
    const { getRootBasedUrl, getStaticBasedPath, jsonUtfStringify } = utils
    const baseQueryUrl = getRootBasedUrl(rootPath, '/')
    const url = req.path.substring(baseQueryUrl.length)
    const history = createMemoryHistory()
    history.push(url)

    const resolveContext = {
      ...constants,
      viewModels,
      origin: '',
    }

    const staticContext = {}
    const markup = ReactDOM.renderToStaticMarkup(
      <ResolveProvider context={resolveContext}>
        <StaticRouter location={url} context={staticContext} history={history}>
          {renderRoutes(getRoutes())}
        </StaticRouter>
      </ResolveProvider>
    )

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
