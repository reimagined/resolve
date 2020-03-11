import React, { useState, useContext, useCallback } from 'react'
import {
  useQuery,
  useCommand,
  useSubscription,
  ResolveContext
} from 'resolve-react-hooks'
// import { connect } from 'react-redux'
// import { connectViewModel } from 'resolve-redux'
// import { routerActions } from 'react-router-redux'
import { Redirect } from 'react-router-dom'
// import { bindActionCreators } from 'redux'
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

import ShoppingListItem from '../components/ShoppingListItem'
import NotFound from '../components/NotFound'
// import * as aggregateActions from '../actions/aggregate_actions'

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
      successCallback: () => setItemText('')
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
        {shoppingList.list.map(item => (
          <ShoppingListItem shoppingListId={aggregateId} item={item} />
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
/*
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'shoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      ...aggregateActions,
      replaceUrl: routerActions.replace
    },
    dispatch
  )
*/
export default ShoppingList
// export default connectViewModel(mapStateToOptions)(connect(mapStateToProps, mapDispatchToProps)(ShoppingList))
