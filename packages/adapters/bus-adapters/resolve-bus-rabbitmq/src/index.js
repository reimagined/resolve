import amqp from 'amqplib'

import createAdapter from './create-adapter'
import init from './init'
import publish from './publish'
import subscribe from './subscribe'
import dispose from './dispose'
import wrapMethod from "./wrap-method"
import onEvent from "./on-event"

export default createAdapter.bind(
  null,
  init,
  publish,
  subscribe,
  dispose,
  wrapMethod,
  onEvent,
  amqp
)
