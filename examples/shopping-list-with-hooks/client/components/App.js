import React from 'react'
import { renderRoutes } from 'react-router-config'

import Header from './Header'

const App = ({
  route,
  children,
  match: {
    params: { id },
  },
}) => (
  <div>
    <Header
      title="ReSolve Shopping List Example"
      name="Shopping List"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
      shoppingListId={id}
    />
    {renderRoutes(route.routes)}
    {children}
  </div>
)

export default App
