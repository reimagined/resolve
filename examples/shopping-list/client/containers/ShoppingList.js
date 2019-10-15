import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
import { Redirect } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import {
  Row,
  Col,
  ListGroup,
  ListGroupItem,
  Checkbox,
  Button,
  InputGroup,
  FormControl,
  FormGroup,
  ControlLabel
} from 'react-bootstrap'

import Image from './Image'
import NotFound from '../components/NotFound'
import * as aggregateActions from '../actions/aggregate_actions'

export class ShoppingList extends React.PureComponent {
  state = {
    shoppingListName: null,
    itemText: ''
  }

  createShoppingItem = () => {
    this.props.createShoppingItem(this.props.aggregateId, {
      text: this.state.itemText,
      id: Date.now().toString()
    })

    this.setState({
      itemText: ''
    })
  }

  updateShoppingListName = event => {
    this.setState({
      shoppingListName: event.target.value
    })
  }

  renameShoppingList = () => {
    this.props.renameShoppingList(this.props.aggregateId, {
      name: this.state.shoppingListName
    })
  }

  removeShoppingList = () => {
    this.props.removeShoppingList(this.props.aggregateId)
  }

  updateItemText = event => {
    this.setState({
      itemText: event.target.value
    })
  }

  onItemTextPressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.createShoppingItem()
    }
  }
  onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.renameShoppingList()
    }
  }

  render() {
    const {
      isLoading,
      data,
      aggregateId,
      toggleShoppingItem,
      removeShoppingItem
    } = this.props

    if (isLoading !== false) {
      return null
    }

    if (data === null) {
      return <NotFound />
    }

    if (data.removed) {
      return <Redirect to="/" />
    }

    const { list } = data

    return (
      <div className="example-wrapper">
        <ControlLabel>Shopping list name</ControlLabel>
        <FormGroup bsSize="large">
          <InputGroup>
            <InputGroup.Button>
              <Button bsSize="large" onClick={this.removeShoppingList}>
                <i className="far fa-trash-alt" />
              </Button>
            </InputGroup.Button>
            <FormControl
              type="text"
              value={
                this.state.shoppingListName == null
                  ? this.props.data.name
                  : this.state.shoppingListName
              }
              onChange={this.updateShoppingListName}
              onKeyPress={this.onShoppingListNamePressEnter}
              onBlur={this.renameShoppingList}
            />
          </InputGroup>
        </FormGroup>
        <ListGroup className="example-list">
          {list.map(todo => (
            <ListGroupItem key={todo.id}>
              <Checkbox
                inline
                checked={todo.checked}
                onChange={toggleShoppingItem.bind(null, aggregateId, {
                  id: todo.id
                })}
              >
                {todo.text}
              </Checkbox>
              <Image
                className="example-close-button"
                src="/close-button.png"
                onClick={removeShoppingItem.bind(null, aggregateId, {
                  id: todo.id
                })}
              />
            </ListGroupItem>
          ))}
        </ListGroup>
        <ControlLabel>Item name</ControlLabel>
        <Row>
          <Col md={8}>
            <FormControl
              className="example-form-control"
              type="text"
              value={this.state.itemText}
              onChange={this.updateItemText}
              onKeyPress={this.onItemTextPressEnter}
            />
          </Col>
          <Col md={4}>
            <Button
              className="example-button"
              bsStyle="success"
              onClick={this.createShoppingItem}
            >
              Add Item
            </Button>
          </Col>
        </Row>
      </div>
    )
  }
}

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

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShoppingList)
)
