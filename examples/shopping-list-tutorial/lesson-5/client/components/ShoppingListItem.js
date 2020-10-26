import React from 'react'
import { ListGroupItem, Checkbox } from 'react-bootstrap'

const ShoppingListItem = ({ item: { id, text } }) => {
  return (
    <ListGroupItem key={id}>
      <Checkbox inline>
        {text}
      </Checkbox>
    </ListGroupItem>
  )
}

export default ShoppingListItem