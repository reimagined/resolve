import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
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

// TODO remove
import commands from '../../common/aggregates/todo.commands'
import { createActions } from 'resolve-redux'
const aggregateActions = createActions({
  name: 'Todo',
  commands
})

const viewModelName = 'Todos'
const aggregateId = 'root-id'

export const App = props => {
  const { todos, createItem, toggleItem, removeItem } = props

  const placeholder = 'New Task'
  const createItemFunc = () => {
    createItem(aggregateId, {
      text: newTodo.value === '' ? placeholder : newTodo.value,
      id: Date.now()
    })
    newTodo.value = ''
  }

  let newTodo

  return (
    <div className="example-wrapper">
      <h1>Task's List</h1>

      <ListGroup className="example-list">
        {Object.keys(todos).map(id => (
          <ListGroupItem key={id}>
            <Checkbox
              inline
              checked={todos[id].checked}
              onChange={toggleItem.bind(null, aggregateId, { id })}
            >
              {todos[id].text}
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

const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  //props => <div>Hello{JSON.stringify(props)}</div>
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
)
