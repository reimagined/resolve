import * as React from 'react'
import { ResolveContext } from 'resolve-react-hooks'
import { render } from 'react-dom'

import App from './App'

const entryPoint = (context: any): any => {
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
