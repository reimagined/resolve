import React, { useState } from 'react'
import { Button, Col, FormLabel, FormControl, Row } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'
import { v4 as uuid } from 'uuid'

const ShoppingListCreator = ({ lists, onCreateSuccess }) => {
  const [shoppingListName, setShoppingListName] = useState('')

  const createShoppingListCommand = useCommand(
    {
      type: 'createShoppingList',
      aggregateId: uuid(),
      aggregateName: 'ShoppingList',
      payload: {
        name: shoppingListName || `Shopping List ${lists.length + 1}`,
      },
    },
    (err, result) => {
      setShoppingListName('')
      onCreateSuccess(err, result)
    }
  )

  const updateShoppingListName = (event) => {
    setShoppingListName(event.target.value)
  }

  const onShoppingListNamePressEnter = (event) => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingListCommand()
    }
  }

  return (
    <div>
      <FormLabel>Shopping list name</FormLabel>
      <Row>
        <Col md={8}>
          <FormControl
            type="text"
            value={shoppingListName}
            onChange={updateShoppingListName}
            onKeyPress={onShoppingListNamePressEnter}
          />
        </Col>
        <Col md={4}>
          <Button bstyle="success" onClick={createShoppingListCommand}>
            Add Shopping List
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingListCreator
