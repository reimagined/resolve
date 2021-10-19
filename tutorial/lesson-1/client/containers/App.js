import React from 'react'
import { Helmet } from 'react-helmet'

const App = ({ staticPath }) => {
  const stylesheetLink = {
    rel: 'stylesheet',
    type: 'text/css',
    href: `${staticPath}/bootstrap.min.css`,
  }
  const links = [stylesheetLink]
  const meta = {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }

  return (
    <div>
      <div>
        <Helmet title="reSolve Shopping List" link={links} meta={[meta]} />
        <h1 align="center">Shopping List</h1>
      </div>
    </div>
  )
}

export default App
