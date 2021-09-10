import React, { useState, useCallback } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'
import { v4 as uuid } from 'uuid'
import { useReduxReadModelSelector, useReduxCommand } from '@resolve-js/redux'
import { SHOPPING_LIST_CREATED } from '../actions/optimistic-actions'

const ShoppingListCreator = () => {
  const [shoppingListName, setShoppingListName] = useState('')

  const lists = useReduxReadModelSelector('all-user-lists') || []

  const { execute: executeCreateListCommand } = useReduxCommand(
    (name) => ({
      type: 'createShoppingList',
      aggregateId: uuid(),
      aggregateName: 'ShoppingList',
      payload: {
        name: name || `Shopping List ${lists.length + 1}`,
      },
    }),
    {
      actions: {
        success: (command) => ({
          type: SHOPPING_LIST_CREATED,
          payload: {
            id: command.aggregateId,
            name: command.payload.name,
          },
        }),
      },
    }
  )

  const createShoppingList = useCallback(() => {
    executeCreateListCommand(shoppingListName)
    setShoppingListName('')
  }, [shoppingListName, setShoppingListName])

  const updateShoppingListName = (event: any) => {
    setShoppingListName(event.target.value)
  }

  const onShoppingListNamePressEnter = useCallback(
    (event) => {
      if (event.charCode === 13) {
        event.preventDefault()
        createShoppingList()
      }
    },
    [createShoppingList]
  )

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
            onClick={createShoppingList}
          >
            Add Shopping List
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingListCreator
