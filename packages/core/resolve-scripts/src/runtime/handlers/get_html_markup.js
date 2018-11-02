import { Helmet } from 'react-helmet'

import jsonUtfStringify from '../utils/json_utf_stringify'

export default ({
  reducers,
  markup,
  styleTags,
  initialState,
  bundleUrl,
  hmrUrl
}) => {
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
    '</script>' +
    `${helmet.script.toString()}` +
    '</head>' +
    `<body ${helmet.bodyAttributes.toString()}>` +
    `<div class="app-container">${markup}</div>` +
    `<script src="${bundleUrl}"></script>` +
    `<script src="${hmrUrl}"></script>` +
    '</body>' +
    '</html>'
  )
}
