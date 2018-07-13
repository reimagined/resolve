import React from 'react'

import Header from '../containers/Header.js'

const App = ({ children }) => (
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
