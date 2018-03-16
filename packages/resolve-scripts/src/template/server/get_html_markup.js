import { Helmet } from 'react-helmet'

import jsonUtfStringify from './utils/json_utf_stringify'

export default ({ markup, initialState, env, clientUrl }) => {
  const helmet = Helmet.renderStatic()

  return (
    `<!doctype html>` +
    `<html ${helmet.htmlAttributes.toString()}>` +
    '<head>' +
    `${helmet.title.toString()}` +
    `${helmet.meta.toString()}` +
    `${helmet.link.toString()}` +
    `${helmet.style.toString()}` +
    '<script>' +
    `window.__INITIAL_STATE__=${jsonUtfStringify(initialState)};` +
    `window.__PROCESS_ENV__=${jsonUtfStringify(env)};` +
    '</script>' +
    `${helmet.script.toString()}` +
    '</head>' +
    `<body ${helmet.bodyAttributes.toString()}>` +
    `<div id="resolve-application-container">${markup}</div>` +
    `<script src="${clientUrl}"></script>` +
    '</body>' +
    '</html>'
  )
}
