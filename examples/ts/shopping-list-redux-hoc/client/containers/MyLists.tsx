import React from 'react'

import { bindActionCreators } from 'redux'
import { connectReadModel } from '@resolve-js/redux'
import { connect } from 'react-redux'

import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'
import * as aggregateActions from '../actions/aggregate_actions'

class MyLists extends React.PureComponent<{
  lists: any[]
  createShoppingList: (...args: any[]) => any
  removeShoppingList: (...args: any[]) => any
}> {
  render() {
    const { lists, createShoppingList, removeShoppingList } = this.props

    return (
      <div className="example-wrapper">
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
  resolverArgs: {},
})

export const mapStateToProps = (state: any) => ({
  lists: state.optimisticShoppingLists || [],
})

export const mapDispatchToProps = (dispatch: any) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(MyLists)
)
