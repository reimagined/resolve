import { internal } from '@resolve-js/redux'
import { optimisticVotingSaga as sagaFactory } from '../../../client/sagas/optimistic-voting-saga'
import {
  optimisticUnvoteStory,
  optimisticUpvoteStory,
} from '../../../client/actions/optimistic-actions'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = internal.actionTypes

test('Optimistic voting saga - register takeAll sagas', () => {
  const optimisticVotingSaga = sagaFactory()
  let step = optimisticVotingSaga.next()
  expect(step.done).toEqual(false)
  const upvoteActionFilter = (step.value as any).payload.args[0]

  expect(
    upvoteActionFilter({
      type: SEND_COMMAND_SUCCESS,
      command: {
        type: 'upvoteStory',
      },
    })
  ).toEqual(true)

  expect(
    upvoteActionFilter({
      type: SEND_COMMAND_FAILURE,
      command: {
        type: 'upvoteStory',
      },
    })
  ).toEqual(false)

  step = optimisticVotingSaga.next()
  expect(step.done).toEqual(false)
  const unvoteActionFilter = (step.value as any).payload.args[0]

  expect(
    unvoteActionFilter({
      type: SEND_COMMAND_SUCCESS,
      command: {
        type: 'unvoteStory',
      },
    })
  ).toEqual(true)

  expect(
    unvoteActionFilter({
      type: SEND_COMMAND_FAILURE,
      command: {
        type: 'unvoteStory',
      },
    })
  ).toEqual(false)

  step = optimisticVotingSaga.next()
  expect(step.done).toEqual(true)
})

test('Optimistic voting saga - upvote success', () => {
  const optimisticVotingSaga = sagaFactory()
  let step = optimisticVotingSaga.next()
  const upvoteSagaFactory = (step.value as any).payload.args[1]
  const upvoteSaga = upvoteSagaFactory({
    command: { aggregateId: 'aggregateId' },
  })

  step = upvoteSaga.next()
  expect(step.done).toEqual(false)
  expect((step.value as any).payload.action).toEqual(
    optimisticUpvoteStory('aggregateId')
  )

  step = upvoteSaga.next()
  expect(step.done).toEqual(true)
})

test('Optimistic voting saga - unvote success', () => {
  const optimisticVotingSaga = sagaFactory()
  let step = optimisticVotingSaga.next()
  step = optimisticVotingSaga.next()
  const unvoteSagaFactory = (step.value as any).payload.args[1]

  const unvoteSaga = unvoteSagaFactory({
    command: { aggregateId: 'aggregateId' },
  })

  step = unvoteSaga.next()
  expect(step.done).toEqual(false)
  expect((step.value as any).payload.action).toEqual(
    optimisticUnvoteStory('aggregateId')
  )

  step = unvoteSaga.next()
  expect(step.done).toEqual(true)
})
