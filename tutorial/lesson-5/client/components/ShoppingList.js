import React, { useState, useEffect } from 'react'
import { useCommandBuilder, useViewModel } from '@resolve-js/react-hooks'

import {
  Row,
  Col,
  ListGroup,
  Button,
  FormControl,
  FormGroup,
  FormLabel,
} from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'

const ShoppingList = ({
  match: {
    params: { id: aggregateId },
  },
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: [],
  })
  const { connect, dispose } = useViewModel(
    'shoppingList',
    [aggregateId],
    setShoppingList
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

  const updateItemText = (event) => {
    setItemText(event.target.value)
  }
  const onItemTextPressEnter = (event) => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingItem(itemText)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div
      style={{
        maxWidth: '580px',
        margin: '0 auto',
        paddingLeft: '10px',
        paddingRight: '10px',
      }}
    >
      <FormLabel>Shopping list name</FormLabel>
      <FormGroup bssize="large">
        <FormControl type="text" value={shoppingList.name} readOnly />
      </FormGroup>
      <ListGroup>
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
            type="text"
            value={itemText}
            onChange={updateItemText}
            onKeyPress={onItemTextPressEnter}
          />
        </Col>
        <Col md={4}>
          <Button
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
