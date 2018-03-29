import React from 'react'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import { NavLink } from 'react-router-dom'

import { Helmet } from 'react-helmet'
import Header from '../components/Header.js'

import actions from '../actions'

const viewModelName = 'Todos'

const Todo = ({ todos, createItem, toggleItem, removeItem, aggregateId }) => {
  let newTodo
  return (
    <div>
      <Helmet>
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
          integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u"
          crossorigin="anonymous"
        />
      </Helmet>

      <Header />

      <h1>
        <NavLink to="/">Home</NavLink> | TODO
      </h1>
      {todos ? (
        <div>
          <ol>
            {Object.keys(todos).map(id => (
              <li key={id}>
                <label>
                  <input
                    type="checkbox"
                    checked={todos[id].checked}
                    onChange={toggleItem.bind(null, aggregateId, { id })}
                  />
                  {todos[id].text}
                </label>
                <span onClick={removeItem.bind(null, aggregateId, { id })}>
                  {' [x]'}
                </span>
              </li>
            ))}
          </ol>
          <input type="text" ref={element => (newTodo = element)} />
          <button
            onClick={() => {
              createItem(aggregateId, {
                text: newTodo.value,
                id: Date.now()
              })
              newTodo.value = ''
            }}
          >
            Add Item
          </button>
        </div>
      ) : null}
    </div>
  )
}

const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName,
    aggregateId,
    todos: state[viewModelName][aggregateId]
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch)

export default connectViewModel(mapStateToProps, mapDispatchToProps)(Todo)
