import React from 'react'
import { useCommand } from '@resolve-js/react-hooks'
import { ListGroupItem, Form } from 'react-bootstrap'

import { StaticImage } from './StaticImage'

type ShoppingListItemProps = {
  shoppingListId: string
  item: { id: string; checked: boolean; text: string }
}

const ShoppingListItem = ({
  shoppingListId,
  item: { id, checked, text },
}: ShoppingListItemProps) => {
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
