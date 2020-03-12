import React, { useState } from 'react'
import { Button, Col, ControlLabel, FormControl, Row } from 'react-bootstrap'
import { useCommand } from 'resolve-react-hooks'
import uuid from 'uuid/v4'

const ShoppingListCreator = ({ lists, onCreateSuccess }) => {
  const [shoppingListName, setShoppingListName] = useState('')

  const createShoppingListCommand = useCommand(
    {
      type: 'createShoppingList',
      aggregateId: uuid(),
      aggregateName: 'ShoppingList',
      payload: {
        name: shoppingListName || `Shopping List ${lists.length + 1}`
      }
    },
    {
      success: result => {
        setShoppingListName('')
        onCreateSuccess(result)
      }
    }
  )

  const updateShoppingListName = event => {
    setShoppingListName(event.target.value)
  }

  const onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingListCommand()
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
            onClick={createShoppingListCommand}
          >
            Add Shopping List
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingListCreator
