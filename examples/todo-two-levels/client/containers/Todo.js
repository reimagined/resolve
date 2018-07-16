import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import { NavLink } from 'react-router-dom'
import {
  ListGroup,
  ListGroupItem,
  Checkbox,
  Form,
  Button,
  FormControl
} from 'react-bootstrap'

import Image from './Image'

const viewModelName = 'Todos'

export const Todo = ({
  todos,
  createItem,
  toggleItem,
  removeItem,
  aggregateId
}) => {
  const placeholder = 'New Task'
  const createItemFunc = () => {
    createItem(aggregateId, {
      text: newTodo.value === '' ? placeholder : newTodo.value,
      id: Date.now()
    })
    newTodo.value = ''
  }

  let newTodo
  let todoList = todos || {}

  return (
    <div className="example-wrapper">
      <Form inline>
        <NavLink to="/">
          <Image
            className="example-arrow-button"
            src="/left-arrow-button.png"
          />
          <span className="example-back-label">Back</span>
        </NavLink>
        <div className="example-task-name">Tasks List</div>
      </Form>

      <ListGroup className="example-list">
        {Object.keys(todoList).map(id => (
          <ListGroupItem key={id}>
            <Checkbox
              inline
              checked={todoList[id].checked}
              onChange={toggleItem.bind(null, aggregateId, { id })}
            >
              {todoList[id].text}
            </Checkbox>
            <Image
              className="example-close-button"
              src="/close-button.png"
              onClick={removeItem.bind(null, aggregateId, { id })}
            />
          </ListGroupItem>
        ))}
      </ListGroup>

      <Form inline className="example-form">
        <FormControl
          className="example-form-control"
          type="text"
          placeholder={placeholder}
          inputRef={element => (newTodo = element)}
          onKeyPress={event => {
            if (event.charCode === 13) {
              event.preventDefault()
              createItemFunc()
            }
          }}
        />
        <Button
          className="example-button"
          bsStyle="success"
          onClick={() => {
            createItemFunc()
          }}
        >
          Add Task
        </Button>
      </Form>
    </div>
  )
}

const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName,
    aggregateIds: [aggregateId]
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    aggregateId: ownProps.match.params.id,
    todos: ownProps.data
  }
}

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Todo)
)
