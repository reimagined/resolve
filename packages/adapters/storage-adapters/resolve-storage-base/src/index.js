import createAdapter from './create-adapter'
import prepare from './prepare'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapDispose from './wrap-dispose'
import validateEventFilter from './validate-event-filter'

export ConcurrentError from './concurrent-error'

const wrappedCreateAdapter = createAdapter.bind(null, {
  prepare,
  wrapMethod,
  wrapEventFilter,
  wrapDispose,
  validateEventFilter
})

export default wrappedCreateAdapter
