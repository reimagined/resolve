import React from 'react'

import { ListGroup, ListGroupItem } from 'react-bootstrap'

class UsersList extends React.Component {
  render() {
    let users = this.props.users || []
    let isLoading = this.props.isLoading

    return (
      <div className="example-list-wrapper">
        <h3 className="example-title">Created Users</h3>

        {isLoading && <div>Data loading</div>}

        {!isLoading && !users.length && <div>No users</div>}

        <ListGroup className="example-list">
          {users.map(user => (
            <ListGroupItem key={user.email} header={user.email}>
              {new Date(user.timestamp).toString()}
            </ListGroupItem>
          ))}
        </ListGroup>
      </div>
    )
  }
}

export default UsersList
