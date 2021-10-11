import React from 'react'
import { renderRoutes } from 'react-router-config'
import Header from './Header'

const App = ({ route, children }) => (
  <div>
    {/*Define the HEAD section and register static resources.
       See the 'client/components/Header' file for implementation details.
    */}
    <Header
      title="ReSolve Shopping List Example"
      css={['/bootstrap.min.css']}
    />
    {renderRoutes(route.routes)}
    {children}
  </div>
)

export default App