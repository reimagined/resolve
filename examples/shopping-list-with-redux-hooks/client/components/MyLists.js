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
