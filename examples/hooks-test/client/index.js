import React from 'react'

import { render } from 'react-dom'

import { ResolveContext } from 'resolve-hooks'

import App from './App'

const entryPoint = context => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveContext.Provider value={context}>
      <App />
    </ResolveContext.Provider>,
    appContainer
  )
}

export default entryPoint
