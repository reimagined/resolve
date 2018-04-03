import React from 'react'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'

import { Helmet } from 'react-helmet'
import {
  ListGroup,
  ListGroupItem,
  Checkbox,
  Col,
  FormGroup,
  Form,
  ControlLabel,
  Button,
  Image,
  FormControl
} from 'react-bootstrap'
import Header from '../components/Header.js'

import actions from '../actions'

const viewModelName = 'Todos'
const aggregateId = 'root-id'

const App = ({ todos, createItem, toggleItem, removeItem, aggregateId }) => {
  const createItemFunc = () => {
    createItem(aggregateId, {
      text: newTodo.value,
      id: Date.now()
    })
    newTodo.value = ''
  }

  let newTodo
  return (
    <div>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="../../static/bootstrap.min.css" />
        <link rel="stylesheet" href="../../static/style.css" />
        <title>reSolve Todo Example</title>
      </Helmet>

      <Header />

      <div
        style={{
          maxWidth: '580px',
          margin: '0 auto',
          paddingLeft: '10px',
          paddingRight: '10px'
        }}
      >
        <h1>Task's List</h1>

        <ListGroup style={{ marginTop: '8%' }}>
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
                inline
                src="../../static/close-button.png"
                onClick={removeItem.bind(null, aggregateId, { id })}
                style={{ cursor: 'pointer', float: 'right' }}
              />
            </ListGroupItem>
          ))}
        </ListGroup>

        <Form inline style={{ marginTop: '7%' }}>
          <FormControl
            type="text"
            placeholder="New Task"
            inputRef={element => (newTodo = element)}
            style={{ minWidth: '83%' }}
            onKeyPress={event => {
              if (event.charCode == 13) {
                event.preventDefault()
                createItemFunc()
              }
            }}
          />
          <Button
            bsStyle="success"
            onClick={() => {
              createItemFunc()
            }}
            style={{ float: 'right' }}
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
  todos: state[viewModelName][aggregateId]
})

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch)

export default connectViewModel(mapStateToProps, mapDispatchToProps)(App)
