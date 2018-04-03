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
        <link rel="stylesheet" href="../../static/bootstrap.min.css" />
        <link rel="stylesheet" href="../../static/style.css" />
        <title>reSolve Todo Example</title>
      </Helmet>

      <Header />

      <div
        style={{
          width: '30%',
          margin: '0 auto'
        }}
      >
        <h1>Task's List</h1>

        <ListGroup style={{ marginTop: '8%' }}>
          {Object.keys(todos).map(id => (
            <ListGroupItem
              key={id}
              className="list-item"
              style={{ height: '40px' }}
            >
              <Form inline style={{ height: '100%' }}>
                <Col sm={1}>
                  <Checkbox
                    checked={todos[id].checked}
                    onChange={toggleItem.bind(null, aggregateId, { id })}
                  />
                </Col>
                <Col sm={10}>{todos[id].text}</Col>
                <Col sm={1}>
                  <Image
                    src="../../static/close-button.png"
                    onClick={removeItem.bind(null, aggregateId, { id })}
                    style={{ cursor: 'pointer' }}
                  />
                </Col>
              </Form>
            </ListGroupItem>
          ))}
        </ListGroup>

        <Form inline style={{ marginTop: '7%' }}>
          <FormControl
            type="text"
            placeholder="New Task"
            inputRef={element => (newTodo = element)}
            style={{ width: '77%' }}
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
            style={{ marginLeft: '3%', width: '20%' }}
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
