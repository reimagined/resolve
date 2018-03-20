import React from 'react'

export const Login = () => (
  <div>
    <h1>Log in to Basic Auth</h1>
    <form action="/auth/local">
      <table>
        <tbody>
          <tr>
            <td>Username:</td>
            <td>
              <input type="text" name="username" />
            </td>
          </tr>
          <tr>
            <td>Password:</td>
            <td>
              <input type="password" name="password" />
            </td>
          </tr>
        </tbody>
      </table>
    </form>
    <h2>Alternatively, you can login using:</h2>
    <button
      style={{
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: '10px 20px'
      }}
    >
      Github
    </button>{' '}
    <button
      style={{
        backgroundColor: '#4285f4',
        color: '#FFFFFF',
        padding: '10px 20px'
      }}
    >
      Google
    </button>
  </div>
)

export default Login
