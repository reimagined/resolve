import React from 'react'
import { Button, Col, FormLabel, FormControl, Row } from 'react-bootstrap'
import { v4 as uuid } from 'uuid'
class ShoppingListCreator extends React.PureComponent {
  constructor() {
    super(...arguments)
    this.state = {
      shoppingListName: '',
    }
    this.updateShoppingListName = (event) => {
      this.setState({
        shoppingListName: event.target.value,
      })
    }
    this.onShoppingListNamePressEnter = (event) => {
      if (event.charCode === 13) {
        event.preventDefault()
        this.createList()
      }
    }
    this.createList = () => {
      this.props.createShoppingList(uuid(), {
        name:
          this.state.shoppingListName ||
          `Shopping List ${this.props.lists.length + 1}`,
      })
      this.setState({
        shoppingListName: '',
      })
    }
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
