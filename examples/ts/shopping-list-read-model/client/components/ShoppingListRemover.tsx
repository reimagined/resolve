import React from 'react'
import { Button } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'

const ShoppingListRemover = ({ shoppingListId }) => {
  const removeShoppingListCommand = useCommand({
    type: 'removeShoppingList',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
  })

  return (
    <Button variant="danger" onClick={() => removeShoppingListCommand()}>
      <i className="far fa-trash-alt" />
    </Button>
  )
}

export default ShoppingListRemover
