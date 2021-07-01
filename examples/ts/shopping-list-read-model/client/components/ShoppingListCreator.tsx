import React, { useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'
import { v4 as uuid } from 'uuid'

const ShoppingListCreator = ({ lists }) => {
  const [shoppingListName, setShoppingListName] = useState('')

  const createShoppingListCommand = useCommand({
    type: 'createShoppingList',
    aggregateId: uuid(),
    aggregateName: 'ShoppingList',
    payload: {
      name: shoppingListName || `Shopping List ${lists.length + 1}`,
    },
  })

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
      <Form.Label>Shopping list name</Form.Label>
      <Row>
        <Col md={8}>
          <Form.Control
            className="example-form-control"
            type="text"
            value={shoppingListName}
            onChange={updateShoppingListName}
            onKeyPress={onShoppingListNamePressEnter}
          />
        </Col>
        <Col md={4}>
          <Button
            className="example-button"
            variant="success"
            onClick={() => createShoppingListCommand()}
          >
            Add Shopping List
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingListCreator
