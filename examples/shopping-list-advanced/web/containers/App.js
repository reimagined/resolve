import React from 'react'
import '@react-native-shopping-list/ui'

import Header from './Header'

const App = ({
  children,
  match: {
    params: { id }
  }
}) => (
  <div>
    <Header
      title="ReSolve React-Native Shopping List Example"
      name="Shopping List"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css', '/fontawesome.min.css', '/style.css']}
      shoppingListId={id}
    />
    {children}
  </div>
)

export default App
