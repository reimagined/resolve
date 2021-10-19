import React from 'react'
import { renderRoutes, RouteConfigComponentProps } from 'react-router-config'
import Header from './Header'

const App = ({ route }: RouteConfigComponentProps) => (
  <div>
    <Header
      title="ReSolve Shopping List Example"
      name="Shopping Lists Example"
      favicon="/favicon.png"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
    />
    {renderRoutes(route.routes)}
  </div>
)

export default App
