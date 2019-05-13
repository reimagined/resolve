import React from 'react'
import { connectViewModel } from 'resolve-redux'

// The example code uses components from the react-bootstrap library to reduce the markup.
import { ListGroup, ListGroupItem, Checkbox } from 'react-bootstrap'

export class ShoppingList extends React.PureComponent {
  render() {
    const list = (this.props.data && this.props.data.list) || []

    return (
      <ListGroup style={{ maxWidth: '500px', margin: 'auto' }}>
        {list.map(todo => (
          <ListGroupItem key={todo.id}>
            <Checkbox inline>{todo.text}</Checkbox>
          </ListGroupItem>
        ))}
      </ListGroup>
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

export default connectViewModel(mapStateToOptions)(ShoppingList)
