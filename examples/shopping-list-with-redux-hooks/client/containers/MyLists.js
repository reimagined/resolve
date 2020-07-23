import { useEffect } from 'react'

import { useReduxReadModel } from 'resolve-redux'
import { useSelector } from 'react-redux'

import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'
import * as aggregateActions from '../actions/aggregate_actions'

const MyLists = () => {
  const { request: getLists, selector: myLists } = useReduxReadModel({
    readModelName: 'ShoppingLists',
    resolveName: 'all'
  })
  const lists = useSelector(myLists)

  useEffect(() => {
    getLists()
  }, [])

  //const { lists, createShoppingList, removeShoppingList } = this.props

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

export default MyLists

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
