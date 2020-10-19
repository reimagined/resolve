import React from 'react'

import Header from './Header'

const App = ({ children }) => (
  <div>
    <Header
      title="HOC tests"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
    />
    {children}
  </div>
)

export default App
