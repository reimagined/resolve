import React, { useState, useEffect } from 'react'
import {
  useCommand,
  useCommandBuilder,
  useReadModelChannel,
} from '@resolve-js/react-hooks'
import { Redirect } from 'react-router-dom'

import { Row, Col, ListGroup, Button, InputGroup, Form } from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'
import NotFound from './NotFound'

type ListNotification = {
  type: 'ItemCreated' | 'ItemRemoved' | 'ItemToggled'
  payload: any
}

const ShoppingList = ({
  match: {
    params: { id: aggregateId },
  },
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    items: [],
    removed: false,
  })

  const { connect, dispose } = useReadModelChannel(
    {
      name: 'ShoppingLists',
      resolver: 'list',
      args: {
        id: aggregateId,
      },
    },
    [],
    (notification: ListNotification) => {
      const { type, payload } = notification
      switch (type) {
        case 'ItemCreated':
          setShoppingList({
            ...shoppingList,
            items: [...shoppingList.items, payload],
          })
          break
        case 'ItemRemoved':
          setShoppingList({
            ...shoppingList,
            items: shoppingList.items.filter(({ id }) => id !== payload.id),
          })
          break
        case 'ItemToggled':
          setShoppingList({
            ...shoppingList,
            items: shoppingList.items.map((item) =>
              item.id === payload.id ? payload : item
            ),
          })
          break
      }
    },
    (result) => {
      setShoppingList(result.data)
    }
  )

  const [itemText, setItemText] = useState('')
  const clearItemText = () => setItemText('')

  const createShoppingItem = useCommandBuilder(
    (text) => ({
      type: 'createShoppingItem',
      aggregateId,
      aggregateName: 'ShoppingList',
      payload: {
        text,
        id: Date.now().toString(),
      },
    }),
    clearItemText
  )

  const updateShoppingListName = (event) => {
    setShoppingList({ ...shoppingList, name: event.target.value })
  }

  const renameShoppingList = useCommand({
    type: 'renameShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: { name: shoppingList ? shoppingList.name : '' },
  })

  const removeShoppingList = useCommand({
    type: 'removeShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
  })

  const updateItemText = (event) => {
    setItemText(event.target.value)
  }
  const onItemTextPressEnter = (event) => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingItem(itemText)
    }
  }
  const onShoppingListNamePressEnter = (event) => {
    if (event.charCode === 13) {
      event.preventDefault()
      renameShoppingList()
    }
  }

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  if (shoppingList == null) {
    return <NotFound />
  }

  if (shoppingList.removed) {
    return <Redirect to="/" />
  }

  return (
    <div className="example-wrapper">
      <Form.Label>Shopping list name</Form.Label>
      <Form.Group>
        <InputGroup size="lg">
          <Button
            size="lg"
            variant="danger"
            onClick={() => removeShoppingList()}
          >
            <i className="far fa-trash-alt" />
          </Button>
          <Form.Control
            type="text"
            value={shoppingList.name}
            onChange={updateShoppingListName}
            onKeyPress={onShoppingListNamePressEnter}
            onBlur={() => renameShoppingList()}
          />
        </InputGroup>
      </Form.Group>
      <ListGroup className="example-list">
        {shoppingList.items.map((item, idx) => (
          <ShoppingListItem
            shoppingListId={aggregateId}
            key={idx}
            item={item}
          />
        ))}
      </ListGroup>
      <Form.Label>Item name</Form.Label>
      <Row>
        <Col md={8}>
          <Form.Control
            className="example-form-control"
            type="text"
            value={itemText}
            onChange={updateItemText}
            onKeyPress={onItemTextPressEnter}
          />
        </Col>
        <Col md={4}>
          <Button
            className="example-button"
            variant="success"
            onClick={() => createShoppingItem(itemText)}
          >
            Add Item
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingList
