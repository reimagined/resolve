import { Helmet } from 'react-helmet'

import jsonUtfStringify from './utils/json_utf_stringify'

import redux from '$resolve.redux'

const reducers = redux.reducers

export default ({ markup, styleTags, initialState, clientUrl }) => {
  const helmet = Helmet.renderStatic()

  for (const reducerName of Object.keys(reducers)) {
    delete initialState[reducerName]
  }

  return (
    `<!doctype html>` +
    `<html ${helmet.htmlAttributes.toString()}>` +
    '<head>' +
    `${helmet.title.toString()}` +
    `${helmet.meta.toString()}` +
    `${helmet.link.toString()}` +
    `${helmet.style.toString()}` +
    styleTags +
    '<script>' +
    `window.__INITIAL_STATE__=${jsonUtfStringify(initialState)};` +
    `window.__LOCAL_DEVELOPMENT__=true;` +
    '</script>' +
    `${helmet.script.toString()}` +
    '</head>' +
    `<body ${helmet.bodyAttributes.toString()}>` +
    `<div class="app-container">${markup}</div>` +
    `<script src="${clientUrl}"></script>` +
    '</body>' +
    '</html>'
  )
}
