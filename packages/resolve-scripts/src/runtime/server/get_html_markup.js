import { Helmet } from 'react-helmet'

import jsonUtfStringify from './utils/json_utf_stringify'

import reducers from '$resolve.redux.reducers'
import viewModels from '$resolve.viewModels'

export default ({ markup, styleTags, initialState, clientUrl }) => {
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
