import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel, connectStaticBasedUrls } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import {
  ListGroup,
  ListGroupItem,
  Checkbox,
  Form,
  Button,
  Image,
  FormControl
} from 'react-bootstrap'

const viewModelName = 'Todos'
const aggregateId = 'root-id'

const StaticBasedImage = connectStaticBasedUrls(['src'])(Image)

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
      <h1>Tasks List</h1>

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
            <StaticBasedImage
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
  )(App)
)
