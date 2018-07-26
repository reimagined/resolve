import React from 'react'

import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'

import Header from './Header.js'
import UsersInput from './UsersInput.js'
import UsersList from './UsersList.js'

import uuid from 'uuid'

class App extends React.Component {
  constructor(props) {
    super(props)

    this.submitUser = props.createUser.bind(this)
  }

  render() {
    return (
      <div>
        <Header
          title="reSolve With Saga"
          name="With Saga Example"
          favicon="/favicon.ico"
          css={['/bootstrap.min.css']}
        />

        <div className="example-wrapper">
          <UsersInput
            submitUser={email => {
              this.submitUser(uuid.v4(), { email: email })
            }}
          />
          <UsersList
            isLoading={this.props.isLoading}
            users={this.props.data.users}
            errorMessage={null}
          />
        </div>
      </div>
    )
  }
}

const mapStateToOptions = () => {
  return {
    readModelName: 'default',
    resolverName: 'default',
    resolverArgs: {},
    isReactive: true
  }
}

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    null,
    mapDispatchToProps
  )(App)
)
