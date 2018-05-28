import { actions } from 'resolve-redux'

import eventStore from './event_store'

const isOpenBrowser = $resolve.openBrowser

const socketHandler = socket => {
  if (isOpenBrowser) {
    socket.emit('event', JSON.stringify(actions.hotModuleReplacement()))
  }

  const emitter = event => socket.emit('event', JSON.stringify(event))

  let unsubscribePromise = eventStore.subscribeOnBus({ types: [], ids: [] }, emitter)
  const unsubscribe = () => {
    if (unsubscribePromise) {
      unsubscribePromise.then(unsubscribeCallback => unsubscribeCallback())
      unsubscribePromise = null
    }
  }

  socket.on('setSubscription', eventsDescription => {
    unsubscribe()
    unsubscribePromise = eventStore.subscribeOnBus(eventsDescription, emitter)
  })

  socket.on('disconnect', unsubscribe)
}

export default socketHandler
