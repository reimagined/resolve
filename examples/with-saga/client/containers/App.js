import React from 'react'

import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'

import Header from './Header.js'
import UsersInput from './UsersInput.js'
import UsersList from './UsersList.js'

import uuid from 'uuid'

let clientId = ''

class App extends React.Component {
  constructor(props) {
    super(props)

    this.submitUser = props.createUser.bind(this)
  }

  render() {
    clientId = document.cookie

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
            isDisabled={this.props.user.disableButton}
            clientId={clientId}
            submitUser={email => {
              this.submitUser(uuid.v4(), { email: email, clientId: clientId })
            }}
          />
          <UsersList isLoading={this.props.isLoading} users={this.props.data} />
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

const mapStateToProps = ({ user }) => ({ user })

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
)
