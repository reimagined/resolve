import React from 'react'

import Header from '../containers/Header'

const Layout = ({ children }) => (
  <div>
    <Header
      title="reSolve Auth Example"
      name="Auth Example"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css', '/style.css']}
    />
    {children}
  </div>
)

export default Layout
