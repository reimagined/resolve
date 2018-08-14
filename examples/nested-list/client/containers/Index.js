import React from 'react'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import { NavLink } from 'react-router-dom'
import {
  ListGroup,
  ListGroupItem,
  Form,
  Button,
  FormControl
} from 'react-bootstrap'

import Image from './Image'

export const Index = ({ createList, removeList, lists }) => {
  const placeholder = 'New List'
  const createListFunc = () => {
    createList(`${Date.now()}`, {
      title: newList.value === '' ? placeholder : newList.value
    })
    newList.value = ''
  }

  let newList

  return (
    <div className="example-wrapper">
      <h1>To-Do Lists</h1>

      <ListGroup className="example-list">
        {(lists || []).map(({ id, title }) => (
          <ListGroupItem key={id}>
            <NavLink to={`/${id}`}>{title}</NavLink>
            <Image
              className="example-close-button"
              src="/close-button.png"
              onClick={() => removeList(id)}
            />
          </ListGroupItem>
        ))}
      </ListGroup>

      <Form inline className="example-form">
        <FormControl
          className="example-form-control"
          type="text"
          placeholder={placeholder}
          inputRef={element => (newList = element)}
          onKeyPress={event => {
            if (event.charCode === 13) {
              event.preventDefault()
              createListFunc()
            }
          }}
        />
        <Button
          className="example-button"
          bsStyle="success"
          onClick={() => {
            createListFunc()
          }}
        >
          Add List
        </Button>
      </Form>
    </div>
  )
}

const mapStateToOptions = () => {
  return {
    readModelName: 'default',
    resolverName: 'default',
    resolverArgs: {}
  }
}

const mapStateToProps = state => {
  return {
    lists: state.optimistic && state.optimistic.lists
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
