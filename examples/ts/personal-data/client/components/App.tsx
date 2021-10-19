import React, { PropsWithChildren } from 'react'
import { renderRoutes, RouteConfigComponentProps } from 'react-router-config'
import Header from './Header'

const App = ({
  children,
  route,
}: PropsWithChildren<RouteConfigComponentProps>) => {
  return (
    <div>
      <Header />
      {renderRoutes(route.routes)}
      {children}
    </div>
  )
}

export default App
