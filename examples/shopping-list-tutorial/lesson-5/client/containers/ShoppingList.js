import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel, sendAggregateAction } from 'resolve-redux'
import { bindActionCreators } from 'redux'

import {
  ListGroup,
  ListGroupItem,
  Checkbox,
  ControlLabel,
  Row,
  Col,
  FormControl,
  Button
} from 'react-bootstrap'

export class ShoppingList extends React.PureComponent {
  state = {
    itemText: ''
  }

  createShoppingItem = () => {
    this.props.createShoppingItem('shopping-list-1', {
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

  render() {
    const list = (this.props.data && this.props.data.list) || []
    const toggleShoppingItem = this.props.toggleShoppingItem

    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
        <ListGroup>
          {list.map(todo => (
            <ListGroupItem key={todo.id}>
              <Checkbox
                inline
                checked={todo.checked}
                onChange={toggleShoppingItem.bind(null, 'shopping-list-1', {
                  id: todo.id
                })}
              >
                {todo.text}
              </Checkbox>
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

// eslint-disable-next-line no-unused-vars
export const mapStateToOptions = (state, ownProps) => {
  return {
    viewModelName: 'shoppingList',
    aggregateIds: ['shopping-list-1']
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      createShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingList'
      ),
      renameShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'renameShoppingList'
      ),
      removeShoppingList: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingList'
      ),
      createShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'createShoppingItem'
      ),
      toggleShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'toggleShoppingItem'
      ),
      removeShoppingItem: sendAggregateAction.bind(
        null,
        'ShoppingList',
        'removeShoppingItem'
      )
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(
    null,
    mapDispatchToProps
  )(ShoppingList)
)
