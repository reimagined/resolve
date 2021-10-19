import React from 'react'
import { Button, Col, FormLabel, FormControl, Row } from 'react-bootstrap'
import { v4 as uuid } from 'uuid'

class ShoppingListCreator extends React.PureComponent<{
  lists: any[]
  createShoppingList: (...args: any[]) => any
}> {
  state = {
    shoppingListName: '',
  }

  updateShoppingListName = (event: any) => {
    this.setState({
      shoppingListName: event.target.value,
    })
  }

  onShoppingListNamePressEnter = (event: any) => {
    if (event.charCode === 13) {
      event.preventDefault()
      this.createList()
    }
  }

  createList = () => {
    this.props.createShoppingList(uuid(), {
      name:
        this.state.shoppingListName ||
        `Shopping List ${this.props.lists.length + 1}`,
    })
    this.setState({
      shoppingListName: '',
    })
  }

  render() {
    return (
      <div>
        <FormLabel>Shopping list name</FormLabel>
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
              variant="success"
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
