import { actionTypes } from 'resolve-redux'
import optimisticVotingSagaFactory from '../../../client/sagas/optimistic-voting-saga'
import {
  optimisticUnvoteStory,
  optimisticUpvoteStory
} from '../../../client/actions/optimistic-actions'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = actionTypes

test('Optimistic voting saga - register takeAll sagas', () => {
  const optimisticVotingSaga = optimisticVotingSagaFactory()
  let step = null

  step = optimisticVotingSaga.next()
  expect(step.done).toEqual(false)
  const upvoteActionFilter = step.value.payload.args[0]

  expect(
    upvoteActionFilter({
      type: SEND_COMMAND_SUCCESS,
      commandType: 'upvoteStory'
    })
  ).toEqual(true)

  expect(
    upvoteActionFilter({
      type: SEND_COMMAND_FAILURE,
      commandType: 'upvoteStory'
    })
  ).toEqual(false)

  step = optimisticVotingSaga.next()
  expect(step.done).toEqual(false)
  const unvoteActionFilter = step.value.payload.args[0]

  expect(
    unvoteActionFilter({
      type: SEND_COMMAND_SUCCESS,
      commandType: 'unvoteStory'
    })
  ).toEqual(true)

  expect(
    unvoteActionFilter({
      type: SEND_COMMAND_FAILURE,
      commandType: 'unvoteStory'
    })
  ).toEqual(false)

  step = optimisticVotingSaga.next()
  expect(step.done).toEqual(true)
})

test('Optimistic voting saga - upvote success', () => {
  const optimisticVotingSaga = optimisticVotingSagaFactory()
  let step = optimisticVotingSaga.next()
  const upvoteSagaFactory = step.value.payload.args[1]
  const upvoteSaga = upvoteSagaFactory({ aggregateId: 'aggregateId' })

  step = upvoteSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value.payload.action).toEqual(
    optimisticUpvoteStory('aggregateId')
  )

  step = upvoteSaga.next()
  expect(step.done).toEqual(true)
})

test('Optimistic voting saga - unvote success', () => {
  const optimisticVotingSaga = optimisticVotingSagaFactory()
  let step = optimisticVotingSaga.next()
  step = optimisticVotingSaga.next()
  const unvoteSagaFactory = step.value.payload.args[1]

  const unvoteSaga = unvoteSagaFactory({ aggregateId: 'aggregateId' })

  step = unvoteSaga.next()
  expect(step.done).toEqual(false)
  expect(step.value.payload.action).toEqual(
    optimisticUnvoteStory('aggregateId')
  )

  step = unvoteSaga.next()
  expect(step.done).toEqual(true)
})
