import React from 'react'

const Login = () => {
  return (
    <div>
      Create user and login
      <form method="POST" action={`/register`}>
        username: <input type="text" name="username" />
        <input type="submit" value="create account" />
      </form>
    </div>
  )
}

export default Login
