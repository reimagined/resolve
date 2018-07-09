import React from 'react'
import { Helmet } from 'react-helmet'
import { connectReadModel } from 'resolve-redux'
import uuid from 'uuid'

import Header from '../components/Header'

class App extends React.Component {
  state = {
    errorMessage: null,
    isFormDisabled: false
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.users) {
      return
    }

    if (this.props.users.length !== nextProps.users.length) {
      this.setState({
        errorMessage: null,
        isFormDisabled: false
      })
      this.refs.email.value = ''
    } else if (this.props.errors.length !== nextProps.errors.length) {
      const lastError = nextProps.errors[nextProps.errors.length - 1]

      this.setState({
        errorMessage: lastError.message,
        isFormDisabled: false
      })
    }
  }

  handleFormSubmit = event => {
    event.preventDefault()
    this.props.createUser({ email: this.refs.email.value })
    this.setState({ isFormDisabled: true })
  }

  render() {
    const { props } = this

    return (
      <div>
        <Helmet>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link rel="stylesheet" href="/bootstrap.min.css" />
          <title>reSolve App With Saga</title>
        </Helmet>

        <Header />

        <div className="container">
          <form onSubmit={this.handleFormSubmit} className="mt-4">
            <div className="form-group row">
              <label
                className="col-sm-2 col-form-label"
                htmlFor="exampleInputEmail1"
              >
                Email
              </label>

              <div className="col-sm-10">
                <input
                  ref="email"
                  type="email"
                  className={[
                    'form-control',
                    this.state.errorMessage ? 'is-invalid' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  id="exampleInputEmail1"
                  placeholder="Enter email"
                  disabled={this.state.isFormDisabled}
                />
                {this.state.errorMessage && (
                  <div className="invalid-feedback">
                    {this.state.errorMessage}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={this.state.isFormDisabled}
            >
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
                    <li key={user.email} className="list-group-item">
                      <div>{user.email}</div>
                      <small>{new Date(user.timestamp).toString()}</small>
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
}

const getStateDate = state => {
  if (!state || !state.readModels || !state.readModels.default) {
    return {}
  }

  const { users, errors } = state.readModels.default.default

  return {
    users: [...users],
    errors: [...errors]
  }
}

const mapStateToProps = state => ({
  ...getStateDate(state),
  readModelName: 'default',
  resolverName: 'default',
  parameters: { timestamp: Date.now() },
  isReactive: true
})

const mapDispatchToProps = (dispatch, props) => ({
  createUser: ({ email }) =>
    dispatch(props.aggregateActions.createUser(uuid.v4(), { email }))
})

export default connectReadModel(mapStateToProps, mapDispatchToProps)(App)
