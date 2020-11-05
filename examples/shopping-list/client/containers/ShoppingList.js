import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { Redirect } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { Row, Col, ListGroup, Button, InputGroup, Form } from 'react-bootstrap'

import { StaticImage } from './StaticImage'
import NotFound from '../components/NotFound'
import * as aggregateActions from '../actions/aggregate_actions'

export class ShoppingList extends React.PureComponent {
  state = {
    shoppingListName: null,
    itemText: '',
  }

  createShoppingItem = () => {
    this.props.createShoppingItem(this.props.aggregateId, {
      text: this.state.itemText,
      id: Date.now().toString(),
    })

    this.setState({
      itemText: '',
    })
  }

  updateShoppingListName = (event) => {
    this.setState({
      shoppingListName: event.target.value,
    })
  }

  renameShoppingList = () => {
    this.props.renameShoppingList(this.props.aggregateId, {
      name: this.state.shoppingListName,
    })
  }

  removeShoppingList = () => {
    this.props.removeShoppingList(this.props.aggregateId)
  }

  updateItemText = (event) => {
    this.setState({
      itemText: event.target.value,
    })
  }

  onItemTextPressEnter = (event) => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.createShoppingItem()
    }
  }
  onShoppingListNamePressEnter = (event) => {
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
      removeShoppingItem,
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
        <Form.Label>Shopping list name</Form.Label>
        <Form.Group>
          <InputGroup size="lg">
            <Button
              size="lg"
              variant="danger"
              onClick={this.removeShoppingList}
            >
              <i className="far fa-trash-alt" />
            </Button>
            <Form.Control
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
        </Form.Group>
        <ListGroup className="example-list">
          {list.map((todo) => (
            <ListGroup.Item key={todo.id}>
              <Form.Check
                inline
                type="checkbox"
                label={todo.text}
                checked={todo.checked}
                onChange={toggleShoppingItem.bind(null, aggregateId, {
                  id: todo.id,
                })}
              />
              <StaticImage
                className="example-close-button"
                src="/close-button.png"
                onClick={removeShoppingItem.bind(null, aggregateId, {
                  id: todo.id,
                })}
              />
            </ListGroup.Item>
          ))}
        </ListGroup>
        <Form.Label>Item name</Form.Label>
        <Row>
          <Col md={8}>
            <Form.Control
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
              variant="success"
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
    aggregateIds: [aggregateId],
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId,
  }
}

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(ShoppingList)
)
