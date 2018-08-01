import React from 'react'

import Header from './Header'

const App = ({ children }) => (
  <div>
    <Header
      title="reSolve To-Do List Example"
      name="To-Do List Example"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css', '/style.css']}
    />
    {children}
  </div>
)

export default App
