import React, { useState } from 'react'
import { Button, Col, ControlLabel, FormControl, Row } from 'react-bootstrap'
import uuid from 'uuid/v4'
import { useReduxReadModelSelector, useReduxCommand } from 'resolve-redux'

export default () => {
  const [shoppingListName, setShoppingListName] = useState('')

  const lists = useReduxReadModelSelector('all-user-lists') || []

  const { execute: executeCreateListCommand } = useReduxCommand({
    type: 'createShoppingList',
    aggregateId: uuid(),
    aggregateName: 'ShoppingList',
    payload: {
      name: shoppingListName || `Shopping List ${lists.length + 1}`
    }
  })

  const updateShoppingListName = event => {
    setShoppingListName(event.target.value)
  }

  const onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      executeCreateListCommand()
      setShoppingListName('')
    }
  }

  return (
    <div>
      <ControlLabel>Shopping list name</ControlLabel>
      <Row>
        <Col md={8}>
          <FormControl
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
            bsStyle="success"
            onClick={executeCreateListCommand}
          >
            Add Shopping List
          </Button>
        </Col>
      </Row>
    </div>
  )
}
