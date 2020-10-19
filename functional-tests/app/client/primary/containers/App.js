import React from 'react'
import { Helmet } from 'react-helmet'

import Counter from './Counter'

const App = ({ staticPath, version }) => {
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: `${staticPath}/bootstrap.min.css`,
  }
  const faviconLink = {
    rel: 'icon',
    type: 'image/png',
    href: `${staticPath}/favicon.ico`,
  }
  const links = [stylesheetLink, faviconLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  return (
    <div>
      <Helmet title="Functional Tests App" link={links} meta={[meta]} />
      <h6 align="left">
        {version != null && version.length > 0 ? `Version ${version}` : ``}
      </h6>
      <Counter version={version} />
    </div>
  )
}

export default App
