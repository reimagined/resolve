import { takeEvery, delay } from 'redux-saga/effects'
import { Client } from '@resolve-js/client'
import { internal } from '@resolve-js/redux'
import { History } from 'history'
import { CommandAction } from '../types'
const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = internal.actionTypes

export function* storyCreateSaga(
  history: History,
  { client }: { client: Client }
) {
  yield takeEvery(
    (action: CommandAction) =>
      action.type === SEND_COMMAND_SUCCESS &&
      action.command.type === 'createStory',
    function* (action) {
      while (true) {
        try {
          const { data } = yield client.query({
            name: 'HackerNews',
            resolver: 'story',
            args: { id: (action as any).command.aggregateId },
          })

          if (data == null) {
            yield delay(300)
            continue
          }

          yield history.push(
            `/storyDetails/${(action as any).command.aggregateId}`
          )
          break
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(error)
          break
        }
      }
    }
  )

  yield takeEvery(
    (action: CommandAction) =>
      action.type === SEND_COMMAND_FAILURE &&
      action.command.type === 'createStory',
    function* () {
      yield history.push(`/error?text=Failed to create a story`)
    }
  )
}
