import React from 'react'
import { renderRoutes } from 'react-router-config'
import Header from './Header'
const App = ({ route }) => (
  <div>
    <Header
      title="ReSolve Shopping List Example"
      name="Shopping List"
      favicon="/favicon.png"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
    />
    {renderRoutes(route.routes)}
  </div>
)
export default App
