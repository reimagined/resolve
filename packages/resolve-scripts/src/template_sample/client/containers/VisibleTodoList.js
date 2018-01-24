import { connect } from 'resolve-redux'
import actions from '../actions'
import TodoList from '../components/TodoList'

const viewModelName = 'todos'
const aggregateId = 'root-id'

const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'SHOW_ALL':
      return todos
    case 'SHOW_COMPLETED':
      return todos.filter(t => t.completed)
    case 'SHOW_ACTIVE':
      return todos.filter(t => !t.completed)
    default:
      throw new Error('Unknown filter: ' + filter)
  }
}

const mapStateToProps = state => ({
  viewModelName,
  aggregateId,
  todos: getVisibleTodos(
    state.viewModels[viewModelName][aggregateId],
    state.visibilityFilter
  )
})

const mapDispatchToProps = {
  completeTodo: actions.completeTodo,
  resetTodo: actions.resetTodo
}

const VisibleTodoList = connect(mapStateToProps, mapDispatchToProps)(TodoList)

export default VisibleTodoList
