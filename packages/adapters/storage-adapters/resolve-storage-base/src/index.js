import createAdapter from './create-adapter'
import prepare from './prepare'
import importStream from './import'
import exportStream from './export'
import wrapMethod from './wrap-method'
import wrapEventFilter from './wrap-event-filter'
import wrapSaveEvent from './wrap-save-event'
import wrapDispose from './wrap-dispose'
import validateEventFilter from './validate-event-filter'
import { FREEZE_MODE_AUTO, FREEZE_MODE_MANUAL } from './constants'
import ConcurrentError from './concurrent-error'

const wrappedCreateAdapter = createAdapter.bind(null, {
  prepare,
  importStream,
  exportStream,
  wrapMethod,
  wrapEventFilter,
  wrapSaveEvent,
  wrapDispose,
  validateEventFilter
})

export default wrappedCreateAdapter

export { ConcurrentError, FREEZE_MODE_AUTO, FREEZE_MODE_MANUAL }
