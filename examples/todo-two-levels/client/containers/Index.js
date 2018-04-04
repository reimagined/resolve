import React from 'react'
import { connectViewModel } from 'resolve-redux'
import { bindActionCreators } from 'redux'
import { NavLink } from 'react-router-dom'

import { Helmet } from 'react-helmet'
import Header from '../components/Header.js'

import actions from '../actions'

const viewModelName = 'Index'

const Index = ({ lists, createList, removeList }) => {
  let newList
  return (
    <div>
      <Helmet>
        <link rel="stylesheet" href="../../static/bootstrap.min.css" />
        <title>reSolve Todo Two Levels Example</title>
      </Helmet>

      <Header />

      <h1>Two level TODO list</h1>
      <ol>
        {lists.map(({ id, title }) => (
          <li key={id}>
            <NavLink to={`/${id}`}>{title}</NavLink>
            <span onClick={() => removeList(id)}>{' [x]'}</span>
          </li>
        ))}
      </ol>
      <input type="text" ref={element => (newList = element)} />
      <button
        onClick={() => {
          createList(Date.now(), {
            title: newList.value
          })
          newList.value = ''
        }}
      >
        Add List
      </button>
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
