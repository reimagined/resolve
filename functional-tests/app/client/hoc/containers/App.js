import React from 'react'
import { renderRoutes } from 'react-router-config'
import Header from './Header'

const App = ({ children, route }) => (
  <div>
    <Header
      title="HOC tests"
      favicon="/favicon.png"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
    />
    {renderRoutes(route.routes)}
    {children}
  </div>
)

export default App
