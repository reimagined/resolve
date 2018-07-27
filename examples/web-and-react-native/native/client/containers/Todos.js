import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { connectViewModel } from '../../resolve/resolve-redux'

import {
  View,
  Text,
  TextInput,
  StyleSheet
} from 'react-native'

const viewModelName = 'Todos'
const aggregateId = 'root-id'

export const Todos = props => {
  const { todos, toggleItem, removeItem } = props
  
  return (
    <View>
      <Text>Tasks List</Text>
      <View>
        {todos.map(({ id, checked, text }) => (
          <View key={id}>
            <Text
              onChange={toggleItem.bind(null, aggregateId, { id })}
            >
              {checked ? 'yes' : 'no'}/{text}
            </Text>
            <Text
              onClick={removeItem.bind(null, aggregateId, { id })}
            >
              X
            </Text>
          </View>
        ))}
      </View>
    </View>
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
  )(Todos)
)
