import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { connectViewModel } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
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

export class ShoppingList extends React.PureComponent {
  state = {
    shoppingListName: this.props.data && this.props.data.name,
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

  updateShoppingListName = event => {
    this.setState({
      shoppingListName: event.target.value
    })
  }

  onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.renameShoppingList()
    }
  }

  renameShoppingList = () => {
    this.props.renameShoppingList(this.props.aggregateId, {
      name: this.state.shoppingListName
    })
  }

  removeShoppingList = () => {
    this.props.removeShoppingList(this.props.aggregateId)
  }

  render() {
    const {
      data,
      aggregateId,
      toggleShoppingItem,
      removeShoppingItem
    } = this.props

    if (data === null) {
      return <NotFound />
    }

    if (data.removed) {
      return <Redirect to="/" />
    }

    const { list } = data

    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
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
              value={this.state.shoppingListName}
              onChange={this.updateShoppingListName}
              onKeyPress={this.onShoppingListNamePressEnter}
              onBlur={this.renameShoppingList}
            />
          </InputGroup>
        </FormGroup>
        <ListGroup>
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
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
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
