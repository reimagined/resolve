import React from 'react'

import Header from './Header.js'
import UsersInput from './UsersInput.js'
import UsersList from './UsersList.js'

const App = () => (
  <div>
    <Header
      title="reSolve With Saga"
      name="With Saga Example"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css']}
    />

    <div className="example-wrapper">
      <UsersInput />
      <UsersList />
    </div>
  </div>
)

export default App
