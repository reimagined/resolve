import React from 'react'

import Header from '../containers/Header'

const Layout = ({ children }) => (
  <div>
    <Header
      title="reSolve Styled-Components Example"
      name="Styled-Components Example"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css', '/style.css']}
    />
    {children}
  </div>
)

export default Layout
