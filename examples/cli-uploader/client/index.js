import React from 'react'
import { render } from 'react-dom'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'
import jsCookie from 'js-cookie'
import jwt from 'jsonwebtoken'

import App from './containers/App'
import Layout from './components/Layout'

const entryPoint = (clientContext) => {
  const token = jsCookie.get('jwt')
  const jwtObject =
    token != null && token.constructor === String ? jwt.decode(token) : null

  const store = createResolveStore(clientContext, {
    redux: {
      reducers: {
        jwt: (token = {}) => token,
      },
    },
    initialState: { jwt: jwtObject },
  })

  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveReduxProvider store={store} context={clientContext}>
      <Layout jwt={jwtObject}>
        <App store={store} CDNUrl={clientContext.cdnUrl} />
      </Layout>
    </ResolveReduxProvider>,
    appContainer
  )
}

export default entryPoint
