import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { ControlLabel } from 'react-bootstrap'

import UserList from '../components/UserList'
import * as aggregateActions from '../redux/aggregate-actions'

class FindUsers extends React.PureComponent {
  shareShoppingListForUser = (userId, username) => {
    const shoppingListId = this.props.shoppingListId

    this.props.shareShoppingListForUser(shoppingListId, { userId, username })
  }

  unshareShoppingListForUser = (userId, username) => {
    const shoppingListId = this.props.shoppingListId

    this.props.unshareShoppingListForUser(shoppingListId, { userId, username })
  }

  render() {
    const { users } = this.props

    return (
      <div>
        <UserList
          buttonText="Share"
          buttonBaseStyle="success"
          users={users.other}
          onPressButton={this.shareShoppingListForUser}
        />
        <ControlLabel>Already shared for users:</ControlLabel>
        <UserList
          buttonText="Unshare"
          buttonBaseStyle="success"
          users={users.sharings}
          onPressButton={this.unshareShoppingListForUser}
        />
      </div>
    )
  }
}

export const mapStateToOptions = (state, { query, shoppingListId }) => ({
  readModelName: 'ShoppingLists',
  resolverName: 'sharings',
  resolverArgs: {
    query,
    shoppingListId
  }
})

export const mapStateToProps = state => ({
  users: state.optimisticSharings.users
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(FindUsers)
)
