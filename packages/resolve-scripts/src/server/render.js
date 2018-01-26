import React from 'react'
import { Helmet } from 'react-helmet'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom'
import ResolveRoutes from '../resolve-routes'
import jsonUtfStringify from './utils/json_utf_stringify'
import serverConfig from '../configs/server.config.js'
import clientConfig from '../configs/client.config.js'

// const configEntries = config.entries
process.env.ROOT_DIR = process.env.ROOT_DIR || ''

const isSsrEnabled = () =>
  serverConfig.ssrMode === 'always' ||
  (serverConfig.ssrMode === 'production-only' &&
    process.env.NODE_ENV === 'production')

export default (initialState, { req, res }) => {
  const html = isSsrEnabled()
    ? renderToString(
        <Provider
          store={clientConfig.createStore(
            Object.assign(initialState, req.initialState)
          )}
        >
          <StaticRouter
            basename={process.env.ROOT_DIR}
            location={req.url}
            context={{}}
          >
            <ResolveRoutes routes={clientConfig.routes} />
          </StaticRouter>
        </Provider>
      )
    : ''

  const helmet = Helmet.renderStatic()

  const bundleSource = `${process.env.ROOT_DIR}/static/bundle.js`

  const filterEnvVariablesRegex = /^RESOLVE_|^NODE_ENV$|^ROOT_DIR$/

  const processEnv = Object.keys(process.env)
    .filter(key => filterEnvVariablesRegex.test(key))
    .reduce((result, key) => {
      result[key] = process.env[key]
      return result
    }, {})

  let jwtStr = ''
  try {
    jwtStr = `window.__JWT__=${jsonUtfStringify(req.getJwtValue())}\n`
  } catch (e) {}

  res.send(
    '<!doctype html>\n' +
      `<html ${helmet.htmlAttributes.toString()}>\n` +
      '<head>\n' +
      `${helmet.title.toString()}` +
      `${helmet.meta.toString()}` +
      `${helmet.link.toString()}` +
      '<script>\n' +
      `window.__INITIAL_STATE__=${jsonUtfStringify(initialState)}\n` +
      jwtStr +
      `window.__PROCESS_ENV__=${jsonUtfStringify(processEnv)}\n` +
      '</script>\n' +
      `${helmet.script.toString()}\n` +
      '</head>\n' +
      `<body ${helmet.bodyAttributes.toString()}>\n` +
      `<div id="root">${html}</div>\n` +
      `<script src="${bundleSource}"></script>\n` +
      '</body>\n' +
      '</html>\n'
  )
}
