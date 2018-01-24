/* @flow */

import type { TodoCreated, TodoCompleted, TodoReset } from './todo-events'
import events from './todo-events'

const Event = (type, payload) => ({
  type,
  payload
})

const { TODO_CREATED, TODO_COMPLETED, TODO_RESET } = events

const throwErrorIfNull = (state: any, todoId: string) => {
  if (!state || !state.find(todo => todo.todoId === todoId)) {
    throw new Error('The aggregate has already been removed')
  }
}

const Aggregate = {
  name: 'Todo',
  initialState: [],
  projection: {
    [TODO_CREATED]: (state: any, event: TodoCreated) =>
      state.concat([{ ...event.payload }]),
    [TODO_COMPLETED]: (state: any, event: TodoCompleted) =>
      state.map(
        todo =>
          todo.todoId === event.payload.todoId
            ? { ...todo, completed: true }
            : todo
      ),
    [TODO_RESET]: (state: any, event: TodoReset) =>
      state.map(
        todo =>
          todo.todoId === event.payload.todoId
            ? { ...todo, completed: false }
            : todo
      )
  },
  commands: {
    createTodo: (state: any, command: TodoCreated) =>
      new Event(TODO_CREATED, {
        completed: false,
        todoId: command.payload.todoId,
        text: command.payload.text
      }),
    completeTodo: (state: any, command: TodoCompleted) => {
      throwErrorIfNull(state, command.payload.todoId)
      return state.find(todo => todo.todoId === command.payload.todoId)
        .completed
        ? null
        : new Event(TODO_COMPLETED, {
            todoId: command.payload.todoId
          })
    },
    resetTodo: (state: any, command: TodoReset) => {
      throwErrorIfNull(state, command.payload.todoId)
      return !state.find(todo => todo.todoId === command.payload.todoId)
        ? null
        : new Event(TODO_RESET, {
            todoId: command.payload.todoId
          })
    }
  }
}

export default Aggregate
