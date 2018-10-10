import zmq from 'zeromq'

import createAdapter from 'resolve-bus-base'
import onMessage from './on-message'
import init from './init'
import publish from './publish'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  onMessage,
  init,
  publish,
  dispose,
  zmq
)
