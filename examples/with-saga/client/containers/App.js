import React from 'react'

import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import uuid from 'uuid'

import Header from './Header.js'
import UsersInput from './UsersInput.js'
import UsersList from './UsersList.js'

let clientId = ''

class App extends React.Component {
  constructor(props) {
    super(props)

    this.submitUser = props.createUser.bind(this)
  }

  render() {
    clientId = clientId || document.cookie || uuid.v4()

    return (
      <div>
        <Header
          title="reSolve With Saga"
          name="With Saga Example"
          favicon="/favicon.ico"
          css={['/bootstrap.min.css', '/style.css']}
        />

        <div className="example-wrapper">
          <UsersInput
            isDisabled={this.props.user.disableButton}
            clientId={clientId}
            submitUser={email => {
              this.submitUser(clientId, { email: email })
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
