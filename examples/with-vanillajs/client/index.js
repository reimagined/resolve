import domready from 'domready'
import initSubscription from './init_subscription'
import createApi from './create_api'
import initUI from './init_ui'
import updateUI from './update_ui'

const main = async ({
  subscribeAdapter: createSubscribeAdapter,
  rootPath,
  viewModels
}) => {
  try {
    await new Promise(resolve => domready(resolve))
    const chatViewModel = viewModels.find(({ name }) => name === 'chat')
    const api = createApi(rootPath)

    const sendMessage = (userName, message) =>
      api
        .sendCommand({
          aggregateName: 'Chat',
          commandType: 'postMessage',
          aggregateId: userName,
          payload: message
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.warn(`Error while sending command: ${error}`)
        })

    let chatViewModelState = window.__INITIAL_STATE__.chat

    initUI(chatViewModelState, sendMessage)

    const chatViewModelUpdater = event => {
      const eventType = event != null && event.type != null ? event.type : null
      const eventHandler = chatViewModel.projection[eventType]

      if (typeof eventHandler === 'function') {
        chatViewModelState = eventHandler(chatViewModelState, event)
      }

      setImmediate(updateUI.bind(null, chatViewModelState))
    }

    chatViewModelUpdater(null)

    const { attachSubscriber, subscribeToTopics } = await initSubscription(
      createSubscribeAdapter,
      rootPath,
      api
    )

    attachSubscriber(chatViewModelUpdater)

    await subscribeToTopics([
      {
        topicName: 'MESSAGE_POSTED',
        topicId: '*'
      }
    ])
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Fatal application error: ${error}`)
  }
}

export default main
