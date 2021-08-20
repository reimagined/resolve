import React from 'react'
import { renderRoutes } from 'react-router-config'
import Header from './Header'
const App = ({ children, route }) => {
  return (
    <div>
      <Header />
      {renderRoutes(route.routes)}
      {children}
    </div>
  )
}
export default App
