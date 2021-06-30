import domready from 'domready'
import { getClient } from '@resolve-js/client'
import initUI from './init-ui'
import updateUI from './update-ui'
const chatRoom = 'chat-room'
const main = async (resolveContext) => {
  await new Promise((resolve) => domready(resolve))
  const { viewModels } = resolveContext
  const chatViewModel = viewModels.find(({ name }) => name === 'chat')
  const client = getClient(resolveContext)
  const sendMessage = (userName, message) =>
    client.command(
      {
        aggregateName: 'Chat',
        type: 'postMessage',
        aggregateId: chatRoom,
        payload: {
          userName,
          message,
        },
      },
      (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.warn(`Error while sending command: ${err}`)
        }
      }
    )
  const queryResult = await client.query({
    name: 'chat',
    aggregateIds: [chatRoom],
    args: undefined,
  })
  const {
    data,
    meta: { url, cursor },
  } = queryResult
  let chatViewModelState = data
  initUI(data, sendMessage)
  const chatViewModelUpdater = (event) => {
    const eventType = event != null && event.type != null ? event.type : null
    const eventHandler = chatViewModel.projection[eventType]
    if (typeof eventHandler === 'function') {
      chatViewModelState = eventHandler(chatViewModelState, event)
    }
    setImmediate(updateUI.bind(null, chatViewModelState))
  }
  await client.subscribe(url, cursor, 'chat', [chatRoom], chatViewModelUpdater)
}
export default main
