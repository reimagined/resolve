import React from 'react'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import { NavLink } from 'react-router-dom'
import {
  ListGroup,
  ListGroupItem
} from 'react-bootstrap'

export const Index = ({ users }) => {
  return (
    <div className="example-wrapper">
      <h1>To-Do Lists by username</h1>

      <ListGroup className="example-list">
        {users.map(({ id, username }) => (
          <ListGroupItem key={id}>
            <NavLink to={`/${id}`}>{username}</NavLink>
          </ListGroupItem>
        ))}
      </ListGroup>
    </div>
  )
}

const mapStateToOptions = () => {
  return {
    readModelName: 'Default',
    resolverName: 'users',
    resolverArgs: {}
  }
}

const mapStateToProps = (state, { data }) => {
  return {
    users: data
  }
}

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Index)
)
