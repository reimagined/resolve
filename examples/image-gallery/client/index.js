import React from 'react'
import { render } from 'react-dom'
import { ResolveProvider } from 'resolve-react-hooks'

import { App } from './containers/App'
import Layout from './components/Layout'

const entryPoint = (clientContext) => {
  render(
    <ResolveProvider context={clientContext}>
      <Layout>
        <App {...clientContext.localS3Constants} />
      </Layout>
    </ResolveProvider>,
    document.getElementById('app-container')
  )
}

export default entryPoint
