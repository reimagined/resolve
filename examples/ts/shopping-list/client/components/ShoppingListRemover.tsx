import React from 'react'
import { Button } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'

type ShoppingListRemoverProps = {
  shoppingListId: string
  onRemoveSuccess: () => any
}

const ShoppingListRemover = ({
  shoppingListId,
  onRemoveSuccess,
}: ShoppingListRemoverProps) => {
  const removeShoppingListCommand = useCommand(
    {
      type: 'removeShoppingList',
      aggregateId: shoppingListId,
      aggregateName: 'ShoppingList',
    },
    onRemoveSuccess
  )

  return (
    <Button variant="danger" onClick={() => removeShoppingListCommand()}>
      <i className="far fa-trash-alt" />
    </Button>
  )
}

export default ShoppingListRemover
