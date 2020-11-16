import React, { useState, useEffect } from 'react'
import {
  useViewModel,
} from 'resolve-react-hooks'

import {
  ListGroup,
  FormControl,
  FormGroup,
  ControlLabel,
} from 'react-bootstrap'

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
    <div>
      <ControlLabel>Shopping list name</ControlLabel>
      <FormGroup bsSize="large">
        <FormControl
          type="text"
          value={shoppingList.name}
          readOnly
        />
      </FormGroup>
      <ListGroup>
        {shoppingList.list.map((item, idx) => (
          <ShoppingListItem
            key={idx}
            item={item}
          />
        ))}
      </ListGroup>
    </div>
  )
}

export default ShoppingList