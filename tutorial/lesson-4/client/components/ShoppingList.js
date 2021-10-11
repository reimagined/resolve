import React, { useState, useEffect } from 'react'
import { useViewModel } from '@resolve-js/react-hooks'

import { ListGroup, FormControl, FormGroup, FormLabel } from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'

// The shopping list populated with items obtained from the ShoppingList View Model.
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
  // The UseViewModel hook connects the component to a View Model
  // and reactively updates the component's state when the View Model's
  // data is updated.
  const { connect, dispose } = useViewModel(
    'shoppingList', // The View Model's name.
    [aggregateId], // The aggregate ID for which to query data.
    setShoppingList // A callback to call when new data is recieved.
  )

  useEffect(() => {
    // Connect to a View Model on component mount and disconnect on unmount.
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