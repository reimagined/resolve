import React, { PropsWithChildren } from 'react'
import { renderRoutes, RouteConfigComponentProps } from 'react-router-config'

import Header from './Header'

const App = ({
  route,
  children,
}: PropsWithChildren<RouteConfigComponentProps>) => (
  <div>
    <Header
      title="ReSolve Shopping List Example"
      name="Shopping List"
      favicon="/favicon.png"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
    />
    {renderRoutes(route.routes)}
    {children}
  </div>
)

export default App
