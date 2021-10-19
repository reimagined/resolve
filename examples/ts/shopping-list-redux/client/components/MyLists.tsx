import React from 'react'
import ShoppingLists from '../components/ShoppingLists'
import ShoppingListCreator from '../components/ShoppingListCreator'

const MyLists = () => {
  return (
    <div className="example-wrapper">
      <ShoppingLists />
      <ShoppingListCreator />
    </div>
  )
}

export default MyLists
