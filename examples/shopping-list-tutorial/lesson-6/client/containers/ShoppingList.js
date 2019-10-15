import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
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

import * as aggregateActions from '../actions/aggregate_actions'

export class ShoppingList extends React.PureComponent {
  state = {
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

  render() {
    const { data, aggregateId, toggleShoppingItem } = this.props

    if (data == null) {
      return null
    }

    const { list } = data

    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
        <ControlLabel>{data.name}</ControlLabel>
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
