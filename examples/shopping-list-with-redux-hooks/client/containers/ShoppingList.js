import React, { useCallback, useEffect, useState } from 'react'
import { useReduxCommand, useReduxViewModel } from 'resolve-redux'
import { Redirect } from 'react-router-dom'

import {
  Row,
  Col,
  ListGroup,
  Button,
  InputGroup,
  FormControl,
  FormGroup,
  ControlLabel
} from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'
import NotFound from '../components/NotFound'
import { useSelector } from 'react-redux'

const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const { connect, dispose, selector: thisList } = useReduxViewModel({
    name: 'shoppingList',
    aggregateIds: [aggregateId]
  })

  const shoppingList = useSelector(thisList) || { list: [] }

  const { execute: executeCreateShoppingItem } = useReduxCommand(text => ({
    type: 'createShoppingItem',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: {
      text,
      id: Date.now().toString()
    }
  }))

  const [itemText, setItemText] = useState('')
  const createShoppingItem = useCallback(
    text => {
      executeCreateShoppingItem(text)
      setItemText('')
    },
    [executeCreateShoppingItem, setItemText]
  )

  const [shoppingListName, setShoppingListName] = useState(null)
  const updateShoppingListName = event => {
    setShoppingListName(event.target.value)
  }

  const { execute: renameShoppingList } = useReduxCommand({
    type: 'renameShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: { name: shoppingList ? shoppingList.name : '' }
  })

  const { execute: removeShoppingList } = useReduxCommand({
    type: 'removeShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList'
  })

  const updateItemText = event => {
    setItemText(event.target.value)
  }
  const onItemTextPressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingItem(itemText)
    }
  }
  const onShoppingListNamePressEnter = event => {
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

  if (shoppingList == null || !shoppingList.list) {
    return <NotFound />
  }

  if (shoppingList.removed) {
    return <Redirect to="/" />
  }

  return (
    <div className="example-wrapper">
      <ControlLabel>Shopping list name</ControlLabel>
      <FormGroup bsSize="large">
        <InputGroup>
          <InputGroup.Button>
            <Button bsSize="large" onClick={removeShoppingList}>
              <i className="far fa-trash-alt" />
            </Button>
          </InputGroup.Button>
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
      <ControlLabel>Item name</ControlLabel>
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
            bsStyle="success"
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
