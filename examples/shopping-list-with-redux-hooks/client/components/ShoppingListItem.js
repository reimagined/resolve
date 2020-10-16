import React from 'react'
import { useReduxCommand } from 'resolve-redux'
import { ListGroupItem, FormCheck } from 'react-bootstrap'

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
      <FormCheck inline checked={checked} onChange={toggleItem} label={text} />
      <Image
        className="example-close-button"
        src="/close-button.png"
        onClick={removeItem}
      />
    </ListGroupItem>
  )
}

export default ShoppingListItem
