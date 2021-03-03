import React from 'react'
import ReactDOM from 'react-dom/server'
import { Helmet } from 'react-helmet'
import jsonwebtoken from 'jsonwebtoken'
import { ResolveProvider } from '@resolve-js/react-hooks'

import { App } from './containers/App'
import Layout from './components/Layout'

const ssrHandler = async (serverContext, req, res) => {
  try {
    const { constants, seedClientEnvs, viewModels, utils } = serverContext
    const { getStaticBasedPath, jsonUtfStringify } = utils
    const { rootPath, staticPath, jwtCookie } = constants

    const jwt = {}
    try {
      Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookie.name]))
    } catch (e) {}

    const resolveContext = {
      ...constants,
      viewModels,
      origin: '',
    }

    const markup = ReactDOM.renderToStaticMarkup(
      <ResolveProvider context={resolveContext}>
        <Layout>
          <App {...serverContext.uploader} />
        </Layout>
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
