import React, { useState, useContext, useCallback } from 'react'
import {
  useQuery,
  useCommand,
  useSubscription,
  ResolveContext
} from 'resolve-react-hooks'
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
import NotFound from './NotFound'

const empty = () => {}

const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: []
  })
  const [itemText, setItemText] = useState('')
  const clearItemText = () => setItemText('')
  const context = useContext(ResolveContext)

  const createShoppingItem = useCommand(
    {
      type: 'createShoppingItem',
      aggregateId,
      aggregateName: 'ShoppingList',
      payload: {
        text: itemText,
        id: Date.now().toString()
      }
    },
    {
      success: clearItemText
    }
  )

  const updateShoppingListName = event => {
    setShoppingList({ ...shoppingList, name: event.target.value })
  }

  const renameShoppingList = useCommand({
    type: 'renameShoppingList',
    aggregateId,
    aggregateName: 'ShoppingList',
    payload: { name: shoppingList ? shoppingList.name : '' }
  })

  const removeShoppingList = useCommand({
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
      createShoppingItem()
    }
  }
  const onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      renameShoppingList()
    }
  }

  const [shoppingListData, requestShoppingList] = useQuery(
    {
      name: 'shoppingList',
      aggregateIds: [aggregateId],
      args: {}
    },
    (error, result) => {
      if (error == null) {
        if (result.data != null) {
          setShoppingList({ ...result.data })
        } else {
          setShoppingList(null)
        }
      }
    }
  )

  const { viewModels } = context
  const viewModel = viewModels.find(({ name }) => name === 'shoppingList')

  const modelEventCallback = useCallback(
    event => {
      const handler = viewModel.projection[event.type]
      const nextShoppingList = handler(shoppingList, event)
      setShoppingList(nextShoppingList)
    },
    [shoppingList]
  )

  useSubscription(
    'shoppingList',
    [aggregateId],
    modelEventCallback,
    empty,
    requestShoppingList
  )

  if (shoppingList === null) {
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
            value={shoppingList.name}
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
            onClick={createShoppingItem}
          >
            Add Item
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingList
