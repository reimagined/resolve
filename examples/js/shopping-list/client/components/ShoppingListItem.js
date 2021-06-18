import React from 'react'
import { useCommand } from '@resolve-js/react-hooks'
import { ListGroupItem, Form } from 'react-bootstrap'
import { StaticImage } from './StaticImage'
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
      <Form.Check
        inline
        type="checkbox"
        label={text}
        checked={checked}
        onChange={() => toggleItem()}
      />
      <StaticImage
        className="example-close-button"
        src="/close-button.png"
        onClick={removeItem}
      />
    </ListGroupItem>
  )
}
export default ShoppingListItem
