import React from 'react'
import { ListGroupItem, FormCheck, Button } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'

const ShoppingListItem = ({ shoppingListId, item: { id, checked, text } }) => {
  const toggleItem = useCommand({
    type: 'toggleShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id,
    },
  })
  const removeItem = useCommand({
    type: 'removeShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id,
    },
  })
  return (
    <ListGroupItem key={id}>
      <FormCheck
        inline
        type="checkbox"
        label={text}
        checked={checked}
        onChange={toggleItem}
      />
      <Button className="float-right" onClick={removeItem}>
        Delete
      </Button>
    </ListGroupItem>
  )
}

export default ShoppingListItem
