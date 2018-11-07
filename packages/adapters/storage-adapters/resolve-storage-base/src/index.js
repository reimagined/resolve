import createAdapter from './create-adapter'
import prepare from './prepare'
import wrapMethod from './wrap-method'
import wrapLoadEvents from './wrap-load-events'
import wrapDispose from './wrap-dispose'

export ConcurrentError from './concurrent-error'

const wrappedCreateAdapter = createAdapter.bind(
  null,
  prepare,
  wrapMethod,
  wrapLoadEvents,
  wrapDispose
)

export default wrappedCreateAdapter
