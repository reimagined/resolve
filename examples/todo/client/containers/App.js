import React from 'react'
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
import Header from '../components/Header.js'

const viewModelName = 'Todos'
const aggregateId = 'root-id'

export const App = ({
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
  return (
    <div>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/bootstrap.min.css" />
        <link rel="stylesheet" href="/style.css" />
        <title>reSolve Todo Example</title>
      </Helmet>

      <Header />

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
    </div>
  )
}

const mapStateToProps = state => ({
  viewModelName,
  aggregateId,
  todos: state.viewModels[viewModelName][aggregateId]
})

const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(props.aggregateActions, dispatch)

export default connectViewModel(mapStateToProps, mapDispatchToProps)(App)
