import { actionTypes } from 'resolve-redux'
import { routerActions } from 'react-router-redux'
import { delay } from 'redux-saga/effects'
import storyCreateSagaFactory from '../../../client/sagas/story-create-saga'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = actionTypes

test('Create story saga - register takeAll sagas', () => {
  const api = {}
  const storyCreateSaga = storyCreateSagaFactory({ api })
  let step = null

  step = storyCreateSaga.next()
  expect(step.done).toEqual(false)
  const successCommandFilter = step.value.payload.args[0]

  expect(
    successCommandFilter({
      type: SEND_COMMAND_SUCCESS,
      commandType: 'createStory'
    })
  ).toEqual(true)

  expect(
    successCommandFilter({
      type: SEND_COMMAND_FAILURE,
      commandType: 'createStory'
    })
  ).toEqual(false)

  step = storyCreateSaga.next()
  expect(step.done).toEqual(false)
  const failureCommandFilter = step.value.payload.args[0]

  expect(
    failureCommandFilter({
      type: SEND_COMMAND_FAILURE,
      commandType: 'createStory'
    })
  ).toEqual(true)

  expect(
    failureCommandFilter({
      type: SEND_COMMAND_SUCCESS,
      commandType: 'createStory'
    })
  ).toEqual(false)

  step = storyCreateSaga.next()
  expect(step.done).toEqual(true)
})

test('Create story saga - success story create and success fetch', () => {
  const readModelStatePromise = Promise.resolve('API_CALL')
  const api = {
    loadReadModelState: jest.fn().mockReturnValue(readModelStatePromise)
  }
  const storyCreateSaga = storyCreateSagaFactory({ api })
  let step = storyCreateSaga.next()
  const successCommandSagaFactory = step.value.payload.args[1]

  const successCommandSaga = successCommandSagaFactory({
    aggregateId: 'aggregateId'
  })

  step = successCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value).toEqual(readModelStatePromise)
  expect(api.loadReadModelState).toBeCalledWith({
    readModelName: 'HackerNews',
    resolverArgs: { id: 'aggregateId' },
    resolverName: 'story'
  })
  expect(api.loadReadModelState).toBeCalledTimes(1)

  step = successCommandSaga.next({ result: 'null' })
  expect(step.done).toEqual(false)
  expect(Object.keys(step.value)).toEqual(Object.keys(delay(300)))

  step = successCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value).toEqual(readModelStatePromise)
  expect(api.loadReadModelState).toBeCalledWith({
    readModelName: 'HackerNews',
    resolverArgs: { id: 'aggregateId' },
    resolverName: 'story'
  })
  expect(api.loadReadModelState).toBeCalledTimes(2)

  step = successCommandSaga.next({ result: '{}' })
  expect(step.done).toEqual(false)
  expect(step.value.payload.action).toEqual(
    routerActions.push(`/storyDetails/aggregateId`)
  )

  step = successCommandSaga.next()
  expect(step.done).toEqual(true)
})

test('Create story saga - success story create and failed fetch', () => {
  const readModelStatePromise = Promise.resolve('API_CALL')
  const api = {
    loadReadModelState: jest.fn().mockReturnValue(readModelStatePromise)
  }
  const storyCreateSaga = storyCreateSagaFactory({ api })
  let step = storyCreateSaga.next()
  const successCommandSagaFactory = step.value.payload.args[1]

  const successCommandSaga = successCommandSagaFactory({
    aggregateId: 'aggregateId'
  })

  step = successCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value).toEqual(readModelStatePromise)
  expect(api.loadReadModelState).toBeCalledWith({
    readModelName: 'HackerNews',
    resolverArgs: { id: 'aggregateId' },
    resolverName: 'story'
  })

  step = successCommandSaga.throw('Reject read model fetch')
  expect(step.done).toEqual(true)
})

test('Create story saga - fail story create', () => {
  const api = {}
  const storyCreateSaga = storyCreateSagaFactory({ api })
  let step = storyCreateSaga.next()
  step = storyCreateSaga.next()
  const failureCommandSagaFactory = step.value.payload.args[1]

  const failureCommandSaga = failureCommandSagaFactory({
    aggregateId: 'aggregateId'
  })

  step = failureCommandSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value.payload.action).toEqual(
    routerActions.push(`/error?text=Failed to create a story`)
  )

  step = failureCommandSaga.next()
  expect(step.done).toEqual(true)
})
