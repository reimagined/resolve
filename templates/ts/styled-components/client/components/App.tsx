import React from 'react'
import { renderRoutes, RouteConfigComponentProps } from 'react-router-config'
import { Header } from '../containers/Header'

const App = ({ route }: RouteConfigComponentProps) => (
  <div>
    <Header
      title="reSolve Styled-Components Example"
      name="Styled-Components Example"
      favicon="/favicon.png"
      css={['/bootstrap.min.css']}
    />
    {renderRoutes(route.routes)}
  </div>
)

export default App
