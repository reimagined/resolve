import React from 'react'
import { ListGroupItem, FormCheck } from 'react-bootstrap'

const ShoppingListItem = ({ item: { id, text } }) => {
  return (
    <ListGroupItem key={id}>
      <FormCheck inline>
        {text}
      </FormCheck>
    </ListGroupItem>
  )
}

export default ShoppingListItem