import React, { useState, useEffect } from 'react'
import { useViewModel } from '@resolve-js/react-hooks'

import { ListGroup, FormControl, FormGroup, FormLabel } from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'

const ShoppingList = ({
  match: {
    params: { id: aggregateId },
  },
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: [],
  })
  const { connect, dispose } = useViewModel(
    'shoppingList',
    [aggregateId],
    setShoppingList
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div
      style={{
        maxWidth: '580px',
        margin: '0 auto',
        paddingLeft: '10px',
        paddingRight: '10px',
      }}
    >
      <FormLabel>Shopping list name</FormLabel>
      <FormGroup bssize="large">
        <FormControl type="text" value={shoppingList.name} readOnly />
      </FormGroup>
      <ListGroup>
        {shoppingList.list.map((item, idx) => (
          <ShoppingListItem key={idx} item={item} />
        ))}
      </ListGroup>
    </div>
  )
}

export default ShoppingList
