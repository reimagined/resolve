import React from 'react'
import { renderRoutes } from 'react-router-config'
import { Header } from '../containers/Header'
const App = ({ route }) => (
  <div>
    <Header
      title="reSolve PostCSS Example"
      name="PostCSS Example"
      favicon="/favicon.png"
      css={['/bootstrap.min.css', '/style.css']}
    />
    {renderRoutes(route.routes)}
  </div>
)
export default App
