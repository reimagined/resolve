import socketIOClient from 'socket.io-client'

import { getRootableUrl } from './util'

export default function subscribeAdapter() {
  let onEvent, onDisconnect
  const origin =
    typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
      ? process.env['ROOT_PATH']
      : window.location.origin
  const socket = socketIOClient(origin, {
    path: getRootableUrl('/socket/'),
    transports: ['websocket']
  })

  socket.on('event', event => onEvent(JSON.parse(event)))

  socket.on('disconnect', reason => onDisconnect(reason))

  return {
    onEvent(callback) {
      onEvent = callback
    },
    onDisconnect(callback) {
      onDisconnect = callback
    },
    setSubscription({ aggregateIds, types }) {
      socket.emit('setSubscription', {
        ids: aggregateIds, // TODO. Fix server-side
        types
      })
    }
  }
}
