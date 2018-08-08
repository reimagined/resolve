import React from 'react'
import uuid from 'uuid/v4'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'
import {
  Button,
  Col,
  ControlLabel,
  FormControl,
  ListGroup,
  ListGroupItem,
  Row
} from 'react-bootstrap'
import { Link } from 'react-router-dom'

class ShoppingLists extends React.PureComponent {
  state = {
    shoppingListName: ''
  }

  updateShoppingListName = event => {
    this.setState({
      shoppingListName: event.target.value
    })
  }

  onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.createList()
    }
  }

  createList = () => {
    this.props.createList(uuid(), {
      name:
        this.state.shoppingListName ||
        `Shopping List ${this.props.lists.length + 1}`
    })
    this.setState({
      shoppingListName: ''
    })
  }

  render() {
    return (
      <div className="example-wrapper">
        <ControlLabel>My shopping lists</ControlLabel>
        <ListGroup>
          {this.props.lists.map(({ id, name }) => (
            <ListGroupItem key={id}>
              <Link to={`/${id}`}>{name}</Link>
            </ListGroupItem>
          ))}
        </ListGroup>
        <ControlLabel>Shopping list name</ControlLabel>
        <Row>
          <Col md={8}>
            <FormControl
              className="example-form-control"
              type="text"
              value={this.state.shoppingListName}
              onChange={this.updateShoppingListName}
              onKeyPress={this.onShoppingListNamePressEnter}
            />
          </Col>
          <Col md={4}>
            <Button
              className="example-button"
              bsStyle="success"
              onClick={this.createList}
            >
              Add Shopping List
            </Button>
          </Col>
        </Row>
      </div>
    )
  }
}

export const mapStateToOptions = () => ({
  readModelName: 'Default',
  resolverName: 'shoppingLists',
  resolverArgs: {}
})

export const mapStateToProps = (state, { data }) => ({
  lists: [...data, ...state.optimisticShoppingLists]
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShoppingLists)
)
