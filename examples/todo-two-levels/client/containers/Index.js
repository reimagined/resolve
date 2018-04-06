import React from 'react'
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

import actions from '../actions'

const viewModelName = 'Index'

const Index = ({ lists, createList, removeList }) => {
  const placeholder = 'New List'
  const createListFunc = () => {
    createList(Date.now(), {
      title: newList.value === '' ? placeholder : newList.value
    })
    newList.value = ''
  }

  let newList

  return (
    <div>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="../../static/bootstrap.min.css" />
        <link rel="stylesheet" href="../../static/style.css" />
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
                src="../../static/close-button.png"
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

const mapStateToProps = state => {
  const aggregateId = '*'

  return {
    viewModelName,
    aggregateId,
    lists: state[viewModelName][aggregateId]
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch)

export default connectViewModel(mapStateToProps, mapDispatchToProps)(Index)
