import React from 'react'
import { Helmet } from 'react-helmet'

import Header from './Header'

const Layout = ({ children }) => (
  <div>
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="/bootstrap.min.css" />
      <link rel="stylesheet" href="/style.css" />
      <title>reSolve Top List Example</title>
    </Helmet>
    <Header />
    {children}
  </div>
)

export default Layout
