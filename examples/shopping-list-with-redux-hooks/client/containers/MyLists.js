import React from 'react'
import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'

export default () => {
  return (
    <div className="example-wrapper">
      <ShoppingLists />
      <ShoppingListCreator />
    </div>
  )
}

/*
export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = state => ({
  lists: state.optimisticShoppingLists || []
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(MyLists)
)
*/
