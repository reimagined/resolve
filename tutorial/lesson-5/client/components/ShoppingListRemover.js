import React from 'react'
import { Button } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'

const ShoppingListRemover = ({ shoppingListId, onRemoveSuccess }) => {
  const removeShoppingListCommand = useCommand(
    {
      type: 'removeShoppingList',
      aggregateId: shoppingListId,
      aggregateName: 'ShoppingList',
    },
    onRemoveSuccess
  )

  return <Button onClick={removeShoppingListCommand}>Delete</Button>
}

export default ShoppingListRemover
