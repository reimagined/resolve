import zmq from 'zeromq'

import createAdapter from './create-adapter'
import wrapInit from './wrap-init'
import wrapMethod from './wrap-method'
import onMessage from './on-message'
import init from './init'
import publish from './publish'
import subscribe from './subscribe'
import dispose from './dispose'

export default createAdapter.bind(
  null,
  wrapInit,
  wrapMethod,
  onMessage,
  init,
  publish,
  subscribe,
  dispose,
  zmq
)
