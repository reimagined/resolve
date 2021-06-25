import React from 'react'
import { renderRoutes } from 'react-router-config'
import Header from './Header'

const App = ({ children, route }) => (
  <div>
    <Header
      title="Redux Hooks Tests"
      favicon="/favicon.png"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
    />
    {renderRoutes(route.routes)}
    {children}
  </div>
)

export { App }
