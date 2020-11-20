import React from 'react'
import { ListGroupItem, FormCheck , Button } from 'react-bootstrap'
import { useCommand } from 'resolve-react-hooks'

const ShoppingListItem = ({shoppingListId, item: { id, checked, text } }) => {
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

        <FormCheck inline checked={checked} onChange={toggleItem}>
          {text}
        </FormCheck>      
        <Button onClick={removeItem} className="pull-right" >
          Delete
        </Button>

    </ListGroupItem>
  )
}

export default ShoppingListItem