import { internal } from '@resolve-js/redux'
import { delay } from 'redux-saga/effects'
import { storyCreateSaga as sagaFactory } from '../../../client/sagas/story-create-saga'
import { createMemoryHistory } from 'history'
import { Context, getClient } from '@resolve-js/client'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = internal.actionTypes

const mockContext: Context = {
  origin: 'mock-origin',
  staticPath: 'static-path',
  rootPath: 'root-path',
  jwtProvider: undefined,
  viewModels: [],
}

test('Create story saga - register takeAll sagas', async () => {
  const client = getClient(mockContext)
  const history = createMemoryHistory()
  const storyCreateSaga = sagaFactory(history, { client })
  let step = null

  step = storyCreateSaga.next()
  expect(step.done).toEqual(false)
  const successCommandFilter = (step.value as any).payload.args[0]

  expect(
    successCommandFilter({
      type: SEND_COMMAND_SUCCESS,
      command: {
        type: 'createStory',
      },
    })
  ).toEqual(true)

  expect(
    successCommandFilter({
      type: SEND_COMMAND_FAILURE,
      command: {
        type: 'createStory',
      },
    })
  ).toEqual(false)

  step = storyCreateSaga.next()
  expect(step.done).toEqual(false)
  const failureCommandFilter = (step.value as any).payload.args[0]

  expect(
    failureCommandFilter({
      type: SEND_COMMAND_FAILURE,
      command: {
        type: 'createStory',
      },
    })
  ).toEqual(true)

  expect(
    failureCommandFilter({
      type: SEND_COMMAND_SUCCESS,
      command: {
        type: 'createStory',
      },
    })
  ).toEqual(false)

  step = storyCreateSaga.next()
  expect(step.done).toEqual(true)
})

test('Create story saga - success story create and success fetch', async () => {
  const readModelStatePromise = Promise.resolve('API_CALL')

  const client = {
    ...getClient(mockContext),
    query: jest.fn().mockResolvedValue(readModelStatePromise),
  }
  const history = createMemoryHistory()

  const storyCreateSaga = sagaFactory(history, { client })
  let step = storyCreateSaga.next()
  const successCommandSagaFactory = (step.value as any).payload.args[1]

  const successCommandSaga = successCommandSagaFactory({
    command: {
      aggregateId: 'aggregateId',
    },
  })

  step = successCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value).toEqual(readModelStatePromise)
  expect(client.query).toBeCalledWith({
    name: 'HackerNews',
    args: { id: 'aggregateId' },
    resolver: 'story',
  })
  expect(client.query).toBeCalledTimes(1)

  step = successCommandSaga.next({ data: null })
  expect(step.done).toEqual(false)
  expect(Object.keys(step.value as any)).toEqual(Object.keys(delay(300)))

  step = successCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value).toEqual(readModelStatePromise)
  expect(client.query).toBeCalledWith({
    name: 'HackerNews',
    args: { id: 'aggregateId' },
    resolver: 'story',
  })
  expect(client.query).toBeCalledTimes(2)

  step = successCommandSaga.next({ data: {} })
  expect(step.done).toEqual(false)
  expect(history.location.pathname).toEqual(`/storyDetails/aggregateId`)
  expect(history.length).toEqual(2)

  step = successCommandSaga.next()
  expect(step.done).toEqual(true)
})

test('Create story saga - success story create and failed fetch', async () => {
  const readModelStatePromise = Promise.resolve('API_CALL')
  const client = {
    ...getClient(mockContext),
    query: jest.fn().mockResolvedValue(readModelStatePromise),
  }
  const history = createMemoryHistory()
  const storyCreateSaga = sagaFactory(history, { client })
  let step = storyCreateSaga.next()
  const successCommandSagaFactory = (step.value as any).payload.args[1]

  const successCommandSaga = successCommandSagaFactory({
    command: {
      aggregateId: 'aggregateId',
    },
  })

  step = successCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value).toEqual(readModelStatePromise)
  expect(client.query).toBeCalledWith({
    name: 'HackerNews',
    args: { id: 'aggregateId' },
    resolver: 'story',
  })

  step = successCommandSaga.throw('Reject read model fetch')
  expect(step.done).toEqual(true)
})

test('Create story saga - story creating failed', async () => {
  const client = getClient(mockContext)
  const history = createMemoryHistory()
  const storyCreateSaga = sagaFactory(history, { client })
  storyCreateSaga.next()
  let step = storyCreateSaga.next()
  const failureCommandSagaFactory = (step.value as any).payload.args[1]

  const failureCommandSaga = failureCommandSagaFactory({
    aggregateId: 'aggregateId',
  })

  step = failureCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(history.location.pathname).toEqual(`/error`)
  expect(history.location.search).toEqual(`?text=Failed to create a story`)
  expect(history.length).toEqual(2)

  step = failureCommandSaga.next()
  expect(step.done).toEqual(true)
})
