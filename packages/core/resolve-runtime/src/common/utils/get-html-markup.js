import { Helmet } from 'react-helmet'

import jsonUtfStringify from './json-utf-stringify'

export default ({
  reducers,
  seedClientEnvs,
  markup,
  styleTags,
  initialState,
  bundleUrl,
  faviconUrl
  // TODO. Revert HMR before 0.18.0. Local Server with HMR / Cloud Server without HMR
  // hmrUrl
}) => {
  const helmet = Helmet.renderStatic()

  for (const reducerName of Object.keys(reducers)) {
    delete initialState[reducerName]
  }

  return (
    `<!doctype html>` +
    `<html ${helmet.htmlAttributes.toString()}>` +
    '<head>' +
    `<link rel="icon" type="image/x-icon" href="${faviconUrl}" />` +
    `${helmet.title.toString()}` +
    `${helmet.meta.toString()}` +
    `${helmet.link.toString()}` +
    `${helmet.style.toString()}` +
    styleTags +
    '<script>' +
    `window.__INITIAL_STATE__=${jsonUtfStringify(initialState)};` +
    `window.__RESOLVE_RUNTIME_ENV__=${jsonUtfStringify(seedClientEnvs)};` +
    '</script>' +
    `${helmet.script.toString()}` +
    '</head>' +
    `<body ${helmet.bodyAttributes.toString()}>` +
    `<div class="app-container">${markup}</div>` +
    `<script src="${bundleUrl}"></script>` +
    // TODO. Revert HMR before 0.18.0. Local Server with HMR / Cloud Server without HMR
    // `<script src="${hmrUrl}"></script>` +
    '</body>' +
    '</html>'
  )
}
