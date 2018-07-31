import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
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
const aggregateId = 'root-id'

export const Todos = props => {
  const { todos, createItem, toggleItem, removeItem } = props

  const placeholder = 'New Task'
  const createItemFunc = () => {
    createItem(aggregateId, {
      text: newTodo.value === '' ? placeholder : newTodo.value,
      id: Date.now().toString()
    })
    newTodo.value = ''
  }

  let newTodo

  return (
    <div className="example-wrapper">
      <h1>Tasks List</h1>

      <ListGroup className="example-list">
        {todos.map(({ id, text, checked }) => (
          <ListGroupItem key={id}>
            <Checkbox
              inline
              checked={checked}
              onChange={toggleItem.bind(null, aggregateId, { id })}
            >
              {text}
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

const mapStateToOptions = () => ({
  viewModelName,
  aggregateIds: [aggregateId]
})

const mapStateToProps = (state, { data }) => ({
  todos: data
})

const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Todos)
)
