import React from 'react'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import { NavLink } from 'react-router-dom'

import { Helmet } from 'react-helmet'
import {
  ListGroup,
  ListGroupItem,
  Checkbox,
  Form,
  Button,
  Image,
  FormControl
} from 'react-bootstrap'
import Header from '../components/Header.js'

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
    <div>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/bootstrap.min.css" />
        <link rel="stylesheet" href="/style.css" />
        <title>reSolve Todo Two Levels Example</title>
      </Helmet>

      <Header />

      <div className="example-wrapper">
        <Form inline>
          <NavLink to="/">
            <Image
              className="example-arrow-button"
              src="/left-arrow-button.png"
            />
            <span className="example-back-label">Back</span>
          </NavLink>
          <div className="example-task-name">Task's List</div>
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
    </div>
  )
}

const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName,
    aggregateId,
    todos: state.viewModels[viewModelName][aggregateId]
  }
}

const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(props.aggregateActions, dispatch)

export default connectViewModel(mapStateToProps, mapDispatchToProps)(Todo)
