import React from 'react'
import { Button, Col, ControlLabel, FormControl, Row } from 'react-bootstrap'
import uuid from 'uuid/v4'

class ShoppingListCreator extends React.PureComponent {
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
    this.props.createShoppingList(uuid(), {
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
      <div>
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

export default ShoppingListCreator
