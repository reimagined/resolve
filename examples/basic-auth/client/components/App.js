import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import Likes from './Likes'

export const App = ({ username }) => (
  <div>
    <h1>{`Hello, ${username || 'Anonymous'}! `}</h1>
    <div>
      {username ? (
        <a href="/auth/local/logout">Logout</a>
      ) : (
        <Link to="/login">Please log into your account to vote</Link>
      )}
    </div>
    {username ? (
      <table>
        <tbody>
          <tr>
            <td>
              <img src="/cat.png" />
            </td>
            <td>
              <img src="/dog.png" />
            </td>
          </tr>
          <tr>
            <Likes aggregateId="cat" />
            <Likes aggregateId="dog" />
          </tr>
        </tbody>
      </table>
    ) : null}
  </div>
)

export const mapStateToProps = state => ({
  username: state.jwt.username
})

export default connect(mapStateToProps)(App)
