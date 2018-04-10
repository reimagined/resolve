import { Helmet } from 'react-helmet'

import jsonUtfStringify from './utils/json_utf_stringify'
import getRootableUrl from './utils/get_rootable_url'

const staticPath = $resolve.staticPath
const reducers = require($resolve.redux.reducers)

export default ({ markup, styleTags, initialState, env }) => {
  const helmet = Helmet.renderStatic()

  for (const reducerName of Object.keys(reducers)) {
    delete initialState[reducerName]
  }

  return (
    `<!doctype html>` +
    `<html ${helmet.htmlAttributes.toString()}>` +
    '<head>' +
    `${helmet.title.toString()}` +
    `<base href="${getRootableUrl(staticPath)}"/>` +
    `${helmet.meta.toString()}` +
    `${helmet.link.toString()}` +
    `${helmet.style.toString()}` +
    styleTags +
    '<script>' +
    `window.__INITIAL_STATE__=${jsonUtfStringify(initialState)};` +
    `window.__PROCESS_ENV__=${jsonUtfStringify(env)};` +
    '</script>' +
    `${helmet.script.toString()}` +
    '</head>' +
    `<body ${helmet.bodyAttributes.toString()}>` +
    `<span id="resolve-application-container">${markup}</span>` +
    `<script src="client.js"></script>` +
    '</body>' +
    '</html>'
  )
}
