import { internal } from '@resolve-js/redux'
import { delay } from 'redux-saga/effects'
import storyCreateSagaFactory from '../../../client/sagas/story-create-saga'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = internal.actionTypes

test('Create story saga - register takeAll sagas', () => {
  const client = {}
  const history = []
  const storyCreateSaga = storyCreateSagaFactory(history, { client })
  let step = null

  step = storyCreateSaga.next()
  expect(step.done).toEqual(false)
  const successCommandFilter = step.value.payload.args[0]

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
  const failureCommandFilter = step.value.payload.args[0]

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

test('Create story saga - success story create and success fetch', () => {
  const readModelStatePromise = Promise.resolve('API_CALL')
  const client = {
    query: jest.fn().mockResolvedValue(readModelStatePromise),
  }
  const history = []
  const storyCreateSaga = storyCreateSagaFactory(history, { client })
  let step = storyCreateSaga.next()
  const successCommandSagaFactory = step.value.payload.args[1]

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
  expect(Object.keys(step.value)).toEqual(Object.keys(delay(300)))

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
  expect(history).toEqual([`/storyDetails/aggregateId`])

  step = successCommandSaga.next()
  expect(step.done).toEqual(true)
})

test('Create story saga - success story create and failed fetch', () => {
  const readModelStatePromise = Promise.resolve('API_CALL')
  const client = {
    query: jest.fn().mockReturnValue(readModelStatePromise),
  }
  const history = []
  const storyCreateSaga = storyCreateSagaFactory(history, { client })
  let step = storyCreateSaga.next()
  const successCommandSagaFactory = step.value.payload.args[1]

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

test('Create story saga - story creating failed', () => {
  const client = {}
  const history = []
  const storyCreateSaga = storyCreateSagaFactory(history, { client })
  let step = storyCreateSaga.next()
  step = storyCreateSaga.next()
  const failureCommandSagaFactory = step.value.payload.args[1]

  const failureCommandSaga = failureCommandSagaFactory({
    aggregateId: 'aggregateId',
  })

  step = failureCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(history).toEqual([`/error?text=Failed to create a story`])

  step = failureCommandSaga.next()
  expect(step.done).toEqual(true)
})
