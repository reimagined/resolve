import React from 'react'
import { useReduxCommand } from 'resolve-redux'
import { ListGroupItem, Form } from 'react-bootstrap'

import Image from './Image'

const ShoppingListItem = ({ shoppingListId, item: { id, checked, text } }) => {
  const { execute: toggleItem } = useReduxCommand({
    type: 'toggleShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id,
    },
  })
  const { execute: removeItem } = useReduxCommand({
    type: 'removeShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id,
    },
  })
  return (
    <ListGroupItem key={id}>
      <Form.Check
        inline
        type="checkbox"
        label={text}
        checked={checked}
        onChange={toggleItem}
      />
      <Image
        className="example-close-button"
        src="/close-button.png"
        onClick={removeItem}
      />
    </ListGroupItem>
  )
}

export default ShoppingListItem
