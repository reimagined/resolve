import React from 'react'

const Logout = () => {
  return (
    <form method="POST" action={`/logout`}>
      username: <input type="hidden" name="username" value="null" />
      <input type="submit" value="logout" />
    </form>
  )
}

export default Logout
