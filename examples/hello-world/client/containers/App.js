import React from 'react'

import Header from '../components/Header.js'

const App = ({ children }) => (
  <div>
    <Header
      title="reSolve Hello World"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css']}
    />
    <h1 align="center">Hello, reSolve world!</h1>
    {children}
  </div>
)

export default App
