import { Helmet } from 'react-helmet'

import jsonUtfStringify from './utils/json_utf_stringify'

const reducers = require($resolve.redux.reducers)
const viewModels = require($resolve.viewModels)

export default ({ markup, styleTags, initialState, env, clientUrl }) => {
  const helmet = Helmet.renderStatic()

  for (const reducerName of Object.keys(reducers)) {
    delete initialState[reducerName]
  }

  for (const viewModel of viewModels) {
    for (const aggregateId of Object.keys(
      initialState.viewModels[viewModel.name]
    )) {
      initialState.viewModels[viewModel.name][
        aggregateId
      ] = viewModel.serializeState(
        initialState.viewModels[viewModel.name][aggregateId]
      )
    }
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
