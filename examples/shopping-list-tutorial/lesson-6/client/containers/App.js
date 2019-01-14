import React from 'react'

import Header from './Header.js'

const App = ({ children }) => (
  <div>
    <Header
      title="reSolve Shopping List"
      name="Shopping List"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css']}
    />
    {children}
  </div>
)

export default App
