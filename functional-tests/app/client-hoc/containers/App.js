import React from 'react'
import { Helmet } from 'react-helmet'

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
      <Helmet title="HOC client" link={links} meta={[meta]} />
      <h2 align="center">HOC client</h2>
    </div>
  )
}

export default App
