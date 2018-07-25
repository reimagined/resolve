import React from 'react'

import { connectReadModel } from 'resolve-redux'

import { Alert, ListGroup, ListGroupItem } from 'react-bootstrap'

const UsersList = ({ isLoading, data: { users, errors } }) => {
  let errorMessage

  return (
    <div className="example-list-wrapper">
      {errorMessage && (
        <Alert className="example-alert" bsStyle="danger">
          {errors}
        </Alert>
      )}

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

const mapStateToOptions = () => {
  return {
    readModelName: 'default',
    resolverName: 'default',
    resolverArgs: {},
    isReactive: true
  }
}

export default connectReadModel(mapStateToOptions)(UsersList)
