import React, { useState } from 'react'
import { Button, Col, FormLabel, FormControl, Row } from 'react-bootstrap'
import uuid from 'uuid/v4'
import { useReduxReadModelSelector, useReduxCommand } from 'resolve-redux'
import { SHOPPING_LIST_CREATED } from '../actions/optimistic-actions'

export default () => {
  const [shoppingListName, setShoppingListName] = useState('')

  const lists = useReduxReadModelSelector('all-user-lists') || []
  //const lists = useSelector(state => state.optimisticShoppingLists)

  const { execute: executeCreateListCommand } = useReduxCommand(
    {
      type: 'createShoppingList',
      aggregateId: uuid(),
      aggregateName: 'ShoppingList',
      payload: {
        name: shoppingListName || `Shopping List ${lists.length + 1}`,
      },
    },
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

  const updateShoppingListName = (event) => {
    setShoppingListName(event.target.value)
  }

  const onShoppingListNamePressEnter = (event) => {
    if (event.charCode === 13) {
      event.preventDefault()
      executeCreateListCommand()
      setShoppingListName('')
    }
  }

  return (
    <div>
      <FormLabel>Shopping list name</FormLabel>
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
            bsstyle="success"
            onClick={executeCreateListCommand}
          >
            Add Shopping List
          </Button>
        </Col>
      </Row>
    </div>
  )
}
