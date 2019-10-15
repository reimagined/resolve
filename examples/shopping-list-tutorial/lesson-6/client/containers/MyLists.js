import React from 'react'

import { bindActionCreators } from 'redux'
import { connectReadModel, sendAggregateAction } from 'resolve-redux'
import { connect } from 'react-redux'

import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'

class MyLists extends React.PureComponent {
  render() {
    const { isLoading, lists, createShoppingList } = this.props

    if (isLoading !== false) {
      return null
    }

    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
        <ShoppingLists lists={lists} />
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
  bindActionCreators(
    {
      createShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingList'
      ),
      renameShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'renameShoppingList'
      ),
      removeShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingList'
      ),
      createShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingItem'
      ),
      toggleShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'toggleShoppingItem'
      ),
      removeShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingItem'
      )
    },
    dispatch
  )

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
