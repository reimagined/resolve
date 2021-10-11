import React from 'react'
import { ListGroupItem, FormCheck } from 'react-bootstrap'

const ShoppingListItem = ({ item: { id, text } }) => {
  return (
    <ListGroupItem key={id}>
      <FormCheck inline type="checkbox" label={text} />
    </ListGroupItem>
  )
}

export default ShoppingListItem