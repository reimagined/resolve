import React from 'react'

import { Header } from '../containers/Header'

const App = ({ children }) => (
  <div>
    <Header
      title="reSolve PostCSS Example"
      name="PostCSS Example"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css', '/style.css']}
    />
    {children}
  </div>
)

export default App
