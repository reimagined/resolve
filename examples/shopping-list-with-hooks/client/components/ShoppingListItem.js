import React from 'react'
import { useCommand } from 'resolve-react-hooks'

import { ListGroupItem, Checkbox } from 'react-bootstrap'

import Image from '../containers/Image'

const ShoppingListItem = ({ shoppingListId, item: { id, checked, text } }) => {
  const toggleItem = useCommand({
    type: 'toggleShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id
    }
  })
  const removeItem = useCommand({
    type: 'removeShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id
    }
  })
  return (
    <ListGroupItem key={id}>
      <Checkbox inline checked={checked} onChange={toggleItem}>
        {text}
      </Checkbox>
      <Image
        className="example-close-button"
        src="/close-button.png"
        onClick={removeItem}
      />
    </ListGroupItem>
  )
}

export default ShoppingListItem
