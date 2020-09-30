import React from 'react'
import { Helmet } from 'react-helmet'

import Counter from './Counter'

const App = ({ staticPath }) => {
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
      <h2 align="center">Basic tests</h2>
      <h2 align="center">View model tests</h2>
      <Counter />
    </div>
  )
}

export default App
