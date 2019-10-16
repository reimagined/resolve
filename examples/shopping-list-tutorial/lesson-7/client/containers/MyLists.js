import React from 'react'

import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'
import * as aggregateActions from '../actions/aggregate_actions'

class MyLists extends React.PureComponent {
  render() {
    const {
      isLoading,
      lists,
      createShoppingList,
      removeShoppingList
    } = this.props

    if (isLoading !== false) {
      return null
    }

    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
        <ShoppingLists lists={lists} removeShoppingList={removeShoppingList} />
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </div>
    )
  }
}

export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

// eslint-disable-next-line no-unused-vars
export const mapStateToProps = (state, ownProps) => ({
  lists: state.optimisticShoppingLists || []
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
