import React from 'react'
import { ListGroupItem, Checkbox, Button, Clearfix } from 'react-bootstrap'
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
      <Clearfix>
        <Checkbox inline checked={checked} onChange={toggleItem}>
          {text}
        </Checkbox>      
        <Button onClick={removeItem} className="pull-right" >
          Delete
        </Button>
      </Clearfix>
    </ListGroupItem>
  )
}

export default ShoppingListItem