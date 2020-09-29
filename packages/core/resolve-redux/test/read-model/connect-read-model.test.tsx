import React from 'react'
import { connect } from 'react-redux'
import configureStore from 'redux-mock-store'
import renderer from 'react-test-renderer'
import connectReadModel from '../../src/read-model/connect-read-model'
import {
  CONNECT_READMODEL,
  DISCONNECT_READMODEL,
} from '../../src/internal/action-types'

const mockStore = configureStore([])
const ConnectedReadModel = connectReadModel((state: any) => state.options)(
  connect((state) => state)(() => <div></div>)
)

let store: any

beforeEach(() => {
  store = mockStore({
    options: {
      readModelName: 'read-model-name',
      resolverName: 'resolver-name',
      resolverArgs: {
        arg: 'a',
      },
    },
  })
})

test('#1541: connected component not updated on connector props change', () => {
  const component = renderer.create(<ConnectedReadModel store={store} />)

  const updatedStore = mockStore({
    options: {
      readModelName: 'new-read-model-name',
      resolverName: 'new-resolver-name',
      resolverArgs: {
        arg: 'b',
      },
    },
  })

  renderer.act(() =>
    component.update(<ConnectedReadModel store={updatedStore} />)
  )

  const dispatchedActions = updatedStore.getActions()

  expect(dispatchedActions[0]).toEqual({
    type: DISCONNECT_READMODEL,
    query: {
      name: 'read-model-name',
      resolver: 'resolver-name',
      args: {
        arg: 'a',
      },
    },
  })
  expect(dispatchedActions[1]).toEqual({
    type: CONNECT_READMODEL,
    query: {
      name: 'new-read-model-name',
      resolver: 'new-resolver-name',
      args: {
        arg: 'b',
      },
    },
  })
})
