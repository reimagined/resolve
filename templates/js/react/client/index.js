import React from 'react'
import { render } from 'react-dom'
import { ResolveProvider } from '@resolve-js/react-hooks'
import App from './containers/App'
const entryPoint = (clientContext) => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveProvider context={clientContext}>
      <App />
    </ResolveProvider>,
    appContainer
  )
}
export default entryPoint
