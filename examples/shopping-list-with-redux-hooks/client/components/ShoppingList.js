import React, { useCallback, useEffect, useState } from 'react'
import { ResultStatus, useReduxCommand, useReduxViewModel } from 'resolve-redux'
import { Redirect } from 'react-router-dom'

import {
  Row,
  Col,
  ListGroup,
  Button,
  InputGroup,
  FormControl,
  FormGroup,
  FormLabel,
} from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'
import NotFound from '../components/NotFound'
import { useSelector } from 'react-redux'

const ShoppingList = ({
  match: {
    params: { id: aggregateId },
  },
}) => {
  const { connect, dispose, selector: thisList } = useReduxViewModel({
    name: 'shoppingList',
    aggregateIds: [aggregateId],
  })

  const { data: shoppingList, status: shoppingListStatus } = useSelector(
    thisList
  )

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
  const updateShoppingListName = (event) => {
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
      <FormLabel>Shopping list name</FormLabel>
      <FormGroup bssize="large">
        <InputGroup>
          <Button bssize="large" variant="danger" onClick={removeShoppingList}>
            <i className="far fa-trash-alt" />
          </Button>
          <FormControl
            type="text"
            value={
              shoppingListName == null ? shoppingList.name : shoppingListName
            }
            onChange={updateShoppingListName}
            onKeyPress={onShoppingListNamePressEnter}
            onBlur={renameShoppingList}
          />
        </InputGroup>
      </FormGroup>
      <ListGroup className="example-list">
        {shoppingList.list.map((item, idx) => (
          <ShoppingListItem
            shoppingListId={aggregateId}
            key={idx}
            item={item}
          />
        ))}
      </ListGroup>
      <FormLabel>Item name</FormLabel>
      <Row>
        <Col md={8}>
          <FormControl
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
            bsstyle="success"
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
