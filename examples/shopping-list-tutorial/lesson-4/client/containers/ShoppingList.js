import React from 'react'
import { connectViewModel } from 'resolve-redux'

import { ListGroup, ListGroupItem, Checkbox } from 'react-bootstrap'

export class ShoppingList extends React.PureComponent {
  render() {
    const list = this.props.data
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

export const mapStateToOptions = (state, ownProps) => {
  return {
    viewModelName: 'ShoppingList',
    aggregateIds: ['root-id']
  }
}

export default connectViewModel(mapStateToOptions)(ShoppingList)
