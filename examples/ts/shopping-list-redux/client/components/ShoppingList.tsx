import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  ResultStatus,
  useReduxCommand,
  useReduxViewModel,
} from '@resolve-js/redux'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { Row, Col, ListGroup, Button, InputGroup, Form } from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'
import NotFound from '../components/NotFound'

type MatchParams = { id: string }

type ShoppingListSelectorResult = {
  data: {
    name: string
    id: string
    list: any[]
    removed: boolean
  }
  status: ResultStatus
}

const ShoppingList = ({
  match: {
    params: { id: aggregateId },
  },
}: RouteComponentProps<MatchParams>) => {
  const { connect, dispose, selector: thisList } = useReduxViewModel({
    name: 'shoppingList',
    aggregateIds: [aggregateId],
    args: undefined,
  })

  const { data: shoppingList, status: shoppingListStatus } = useSelector<
    any,
    ShoppingListSelectorResult
  >(thisList)

  const { execute: executeCreateShoppingItem } = useReduxCommand((text) => ({
    type: 'createShoppingItem',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: {
      text,
      id: Date.now().toString(),
    },
  }))

  const [itemText, setItemText] = useState('')
  const createShoppingItem = useCallback(
    (text) => {
      executeCreateShoppingItem(text)
      setItemText('')
    },
    [executeCreateShoppingItem, setItemText]
  )

  const [shoppingListName, setShoppingListName] = useState(null)
  const updateShoppingListName = (event: any) => {
    setShoppingListName(event.target.value)
  }

  const { execute: renameShoppingList } = useReduxCommand({
    type: 'renameShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: { name: shoppingList ? shoppingList.name : '' },
  })

  const { execute: removeShoppingList } = useReduxCommand({
    type: 'removeShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
  })

  const updateItemText = (event: any) => {
    setItemText(event.target.value)
  }
  const onItemTextPressEnter = (event: any) => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingItem(itemText)
    }
  }
  const onShoppingListNamePressEnter = (event: any) => {
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

  if (
    shoppingListStatus === ResultStatus.Requested ||
    shoppingListStatus === ResultStatus.Initial
  ) {
    return null
  }

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
            value={
              shoppingListName == null ? shoppingList.name : shoppingListName
            }
            onChange={updateShoppingListName}
            onKeyPress={onShoppingListNamePressEnter}
            onBlur={() => renameShoppingList()}
          />
        </InputGroup>
      </Form.Group>
      <ListGroup className="example-list">
        {shoppingList.list.map((item, idx) => (
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
