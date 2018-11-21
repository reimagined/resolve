import createViewModelsReducer from '../src/create_view_models_reducer'
import {
  loadViewModelStateRequest,
  loadViewModelStateSuccess,
  loadViewModelStateFailure,
  dropViewModelState,
  connectViewModel,
  disconnectViewModel
} from '../src/actions'

describe('createViewModelsReducer', () => {
  const TODO_CREATE = 'TODO_CREATE'
  const TODO_CHECKED = 'TODO_CHECKED'

  const viewModels = [
    {
      name: 'Todos',
      projection: {
        Init() {
          return []
        },
        [TODO_CREATE]: (state, event) => {
          return [
            ...state,
            {
              id: event.aggregateId,
              checked: false
            }
          ]
        },
        [TODO_CHECKED]: (state, event) => {
          return state.map(todo =>
            todo.id === event.aggregateId
              ? {
                  ...todo,
                  checked: !todo.checked
                }
              : todo
          )
        }
      }
    },
    {
      name: 'Count',
      projection: {
        Init() {
          return 0
        },
        [TODO_CREATE]: state => {
          return state + 1
        }
      }
    }
  ]

  test('reducer work correctly', () => {
    const reducer = createViewModelsReducer(viewModels)

    let state = reducer(undefined, { type: '@@redux/INIT' })

    state = reducer(state, connectViewModel('Todos', ['1', '2', '3'], {}))
    expect(state).toMatchSnapshot()

    state = reducer(state, connectViewModel('Todos', '*', {}))
    expect(state).toMatchSnapshot()

    state = reducer(
      state,
      loadViewModelStateRequest('Todos', ['1', '2', '3'], {})
    )
    expect(state).toMatchSnapshot()

    state = reducer(state, loadViewModelStateRequest('Todos', '*', {}))
    expect(state).toMatchSnapshot()

    state = reducer(
      state,
      loadViewModelStateSuccess(
        'Todos',
        ['1', '2', '3'],
        {},
        ['A', 'B', 'C', 'D'],
        { '1': 1, '2': 1, '3': 2 }
      )
    )
    expect(state).toMatchSnapshot()

    state = reducer(
      state,
      loadViewModelStateSuccess('Todos', '*', {}, ['A', 'B', 'C', 'D'], {
        '1': 1,
        '2': 1,
        '3': 2
      })
    )
    expect(state).toMatchSnapshot()

    state = reducer(state, disconnectViewModel('Todos', ['1', '2', '3'], {}))
    expect(state).toMatchSnapshot()

    state = reducer(state, disconnectViewModel('Todos', '*', {}))
    expect(state).toMatchSnapshot()

    state = reducer(state, dropViewModelState('Todos', ['1', '2', '3'], {}))
    expect(state).toMatchSnapshot()

    state = reducer(state, dropViewModelState('Todos', '*', {}))
    expect(state).toMatchSnapshot()

    state = reducer(state, connectViewModel('Todos', '*', {}))
    expect(state).toMatchSnapshot()

    state = reducer(state, loadViewModelStateRequest('Todos', '*', {}))
    expect(state).toMatchSnapshot()

    state = reducer(state, loadViewModelStateFailure('Todos', '*', {}, 'error'))
    expect(state).toMatchSnapshot()
  })
})
