import React, { useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import { useCommand } from '@resolve-js/react-hooks'
import { v4 as uuid } from 'uuid'

type ShoppingListCreatorProps = {
  lists: any[]
  onCreateSuccess: (...args: any[]) => any
}

const ShoppingListCreator = ({
  lists,
  onCreateSuccess,
}: ShoppingListCreatorProps) => {
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
    (err, result, { aggregateId, payload }) => {
      setShoppingListName('')
      onCreateSuccess(err, { aggregateId, payload })
    }
  )

  const updateShoppingListName = (event: any) => {
    setShoppingListName(event.target.value)
  }

  const onShoppingListNamePressEnter = (event: any) => {
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
