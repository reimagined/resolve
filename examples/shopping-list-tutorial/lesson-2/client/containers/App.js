import React from 'react'

import Header from './Header.js'

const App = () => (
  <div>
    <Header
      title="reSolve Shopping List"
      name="Shopping List"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css']}
    />
    <h1 align="center">Shopping List</h1>
  </div>
)

export default App
