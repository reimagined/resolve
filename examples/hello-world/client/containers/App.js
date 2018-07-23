import React from 'react'

import Header from './Header.js'

const App = () => (
  <div>
    <Header
      title="reSolve Hello World"
      name="Hello World Example"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css']}
    />
    <h1 align="center">Hello, reSolve world!</h1>
  </div>
)

export default App
