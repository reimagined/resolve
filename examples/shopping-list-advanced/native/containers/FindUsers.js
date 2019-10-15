import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { View, StyleSheet } from 'react-native'
import { Label } from 'native-base'

import { connectReadModel } from 'resolve-redux'

import * as aggregateActions from '../redux/actions/aggregate-actions'
import UserList from '../components/UserList'

const styles = StyleSheet.create({
  label: {
    marginTop: 15,
    paddingLeft: 5,
    fontSize: 16,
    color: '#575757'
  }
})

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
      <View>
        <UserList
          buttonText="Share"
          buttonBaseStyle="success"
          users={users.other}
          onPressButton={this.shareShoppingListForUser}
        />
        <Label style={styles.label}>Already shared for users:</Label>
        <UserList
          buttonText="Unshare"
          buttonBaseStyle="success"
          users={users.sharings}
          onPressButton={this.unshareShoppingListForUser}
        />
      </View>
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
