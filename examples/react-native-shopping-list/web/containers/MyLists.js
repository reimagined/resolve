import React from 'react'

import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import requiredAuth from '../decorators/requiredAuth'
import ShoppingLists from "../components/ShoppingLists";
import ShoppingListCreator from "../components/ShoppingListCreator";

class MyLists extends React.PureComponent {
  render() {
    const { lists, createShoppingList } = this.props
  
    return (
      <div className="example-wrapper">
        <ShoppingLists lists={lists}/>
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </div>
    )
  }
}

export const mapStateToOptions = () => ({
  readModelName: 'Default',
  resolverName: 'shoppingLists',
  resolverArgs: {}
})

export const mapStateToProps = (state, { data }) => ({
  lists: [...data, ...state.optimisticShoppingLists]
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default requiredAuth(
  connectReadModel(mapStateToOptions)(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(MyLists)
  )
)
