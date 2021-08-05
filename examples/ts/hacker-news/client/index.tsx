import React from 'react'
import { render } from 'react-dom'
import { renderRoutes } from 'react-router-config'
import { Router } from 'react-router'
import { createBrowserHistory } from 'history'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'

import { getRoutes } from './get-routes'
import getRedux from './get-redux'

// eslint-disable-next-line spellcheck/spell-checker
const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/
const atob = (inputString: any) => {
  let string: any = inputString
  string = String(string).replace(/[\t\n\f\r ]+/g, '')
  if (!b64re.test(string)) {
    throw new TypeError(
      "Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded."
    )
  }
  string += '=='.slice(2 - (string.length & 3))
  let bitmap = 0
  let result = ''
  let r1 = -1
  let r2 = -1
  let i = 0
  for (; i < string.length; ) {
    bitmap =
      (b64.indexOf(string.charAt(i++)) << 18) |
      (b64.indexOf(string.charAt(i++)) << 12) |
      ((r1 = b64.indexOf(string.charAt(i++))) << 6) |
      (r2 = b64.indexOf(string.charAt(i++)))

    result +=
      r1 === 64
        ? String.fromCharCode((bitmap >> 16) & 255)
        : r2 === 64
        ? String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255)
        : String.fromCharCode(
            (bitmap >> 16) & 255,
            (bitmap >> 8) & 255,
            bitmap & 255
          )
  }
  return result
}

const getJwt = (cookieName: string) => {
  try {
    const matches = document.cookie.match(
      new RegExp(
        '(?:^|; )' +
          cookieName.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
          '=([^;]*)'
      )
    )
    const cookie = matches ? decodeURIComponent(matches[1]) : null
    return JSON.parse(atob(cookie.split('.')[1]))
  } catch (e) {
    return null
  }
}

const entryPoint = (inputClientContext) => {
  const clientContext = {
    ...inputClientContext,
    staticPath: window.location.origin + '/',
  }
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)

  const initialState = {
    comments: {},
    optimistic: {
      votedStories: {},
    },
    jwt: getJwt('jwt'),
    viewModels: {},
    readModels: {},
  } as any

  const history = createBrowserHistory({ basename: clientContext.rootPath })
  const routes = getRoutes()
  const redux = getRedux(clientContext.clientImports, history)

  const store = createResolveStore(clientContext, {
    serializedState: initialState,
    redux,
  })

  render(
    <ResolveReduxProvider context={clientContext} store={store}>
      <Router history={history}>{renderRoutes(routes)}</Router>
    </ResolveReduxProvider>,
    appContainer
  )
}

export default entryPoint
