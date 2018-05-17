import React from 'react'
import { Helmet } from 'react-helmet'
import { connectReadModel } from 'resolve-redux'
import uuid from 'uuid'

import actions from '../../actions'
import Header from '../components/Header'

const App = props => {
  let emailInput

  return (
    <div>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/bootstrap.min.css" />
        <title>reSolve Hello World</title>
      </Helmet>

      <Header />

      <div className="container">
        <form
          onSubmit={event => {
            event.preventDefault()
            props.createUser({ email: emailInput.value })
          }}
        >
          <div className="form-group row">
            <label
              className="col-sm-2 col-form-label"
              htmlFor="exampleInputEmail1"
            >
              Email
            </label>

            <div className="col-sm-10">
              <input
                ref={element => (emailInput = element)}
                type="email"
                className="form-control"
                id="exampleInputEmail1"
                placeholder="Enter email"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </form>

        <div className="mt-4">
          <h5>Created users</h5>

          {(() => {
            if (!props.users) {
              return <span>Data loading...</span>
            }

            if (props.users.length === 0) {
              return <span>No users</span>
            }

            return (
              <ul className="list-group">
                {props.users.map(user => (
                  <li
                    key={user.email}
                    className="list-group-item d-flex align-items-center"
                  >
                    <div className="flex-grow-1">
                      <div>{user.email}</div>
                      <small>{new Date(user.creationTime).toString()}</small>
                    </div>
                    <button className="btn btn-primary">Delete</button>
                  </li>
                ))}
              </ul>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  readModelName: 'default',
  resolverName: 'users',
  users:
    state && state.readModels && state.readModels.default
      ? state.readModels.default.users
      : null
})

const mapDispatchToProps = dispatch => ({
  createUser: ({ email }) => dispatch(actions.createUser(uuid.v4(), { email }))
})

export default connectReadModel(mapStateToProps, mapDispatchToProps)(App)
