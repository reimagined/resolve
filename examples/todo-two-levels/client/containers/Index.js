import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import { NavLink } from 'react-router-dom'

import { Helmet } from 'react-helmet'
import {
  ListGroup,
  ListGroupItem,
  Form,
  Button,
  Image,
  FormControl
} from 'react-bootstrap'
import Header from '../components/Header.js'

// TODO remove
import commands from '../../common/aggregates/todo.commands'
import { createActions } from 'resolve-redux'
const aggregateActions = createActions({
  name: 'Todo',
  commands
})

const viewModelName = 'Lists'

export const Index = ({ lists, createList, removeList }) => {
  const placeholder = 'New List'
  const createListFunc = () => {
    createList(`${Date.now()}`, {
      title: newList.value === '' ? placeholder : newList.value
    })
    newList.value = ''
  }

  let newList

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
        <h1>Todo's List</h1>

        <ListGroup className="example-list">
          {lists.map(({ id, title }) => (
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
    </div>
  )
}

const mapStateToOptions = () => {
  return {
    viewModelName,
    aggregateIds: '*'
  }
}

const mapStateToProps = (state, { data }) => {
  return {
    lists: data
  }
}

const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Index)
)
